---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - 算法调优
---

# Cartographer 算法调优指南

> [!NOTE]
> 本文档翻译自 [Cartographer ROS - Algorithm walkthrough for tuning](https://google-cartographer-ros.readthedocs.io/en/latest/algo_walkthrough.html)
> 
> Apache License, Version 2.0

## 引言

Cartographer 是一个复杂的系统，对其进行调优需要深入理解其内部工作原理。本文旨在直观地介绍 Cartographer 所使用的各个子系统及其配置参数。如需深入了解 Cartographer，建议参阅其相关论文。该论文主要描述 2D SLAM，但其中严格定义的大部分概念同样适用于 3D 场景。

**参考文献：**

W. Hess, D. Kohler, H. Rapp, and D. Andor,
[Real-Time Loop Closure in 2D LIDAR SLAM](https://research.google.com/pubs/pub45466.html), in
*Robotics and Automation (ICRA), 2016 IEEE International Conference on*.
IEEE, 2016. pp. 1271–1278.

## 系统概述

![系统架构图](https://raw.githubusercontent.com/cartographer-project/cartographer/master/docs/source/high_level_system_overview.png)

Cartographer 可以看作两个独立但相关的子系统。

### 局部 SLAM（Local SLAM）

第一个子系统是**局部 SLAM**（有时也称为**前端**或局部轨迹构建器）。其主要任务是构建一系列**子图（submaps）**。每个子图都应保持局部一致性，但我们也需要认识到局部 SLAM 会随时间产生漂移。

大多数局部 SLAM 选项可以在以下文件中找到：
- 2D：[trajectory_builder_2d.lua](https://github.com/cartographer-project/cartographer/blob/df337194e21f98f8c7b0b88dab33f878066d4b56/configuration_files/trajectory_builder_2d.lua)
- 3D：[trajectory_builder_3d.lua](https://github.com/cartographer-project/cartographer/blob/df337194e21f98f8c7b0b88dab33f878066d4b56/configuration_files/trajectory_builder_3d.lua)

（本文后续将用 `TRAJECTORY_BUILDER_nD` 指代通用选项）

### 全局 SLAM（Global SLAM）

另一个子系统是**全局 SLAM**（有时也称为**后端**）。它在后台线程中运行，主要任务是寻找**回环约束（loop closure constraints）**。它通过将 **节点（nodes）** 中收集的 **扫描（scans）** 与子图进行扫描匹配来实现这一目标。同时，它还融合其他传感器数据，以获得更高层次的全局视图并确定最一致的全局解决方案。在 3D 模式下，它还会尝试确定重力方向。

大多数选项可以在 [pose_graph.lua](https://github.com/cartographer-project/cartographer/blob/df337194e21f98f8c7b0b88dab33f878066d4b56/configuration_files/pose_graph.lua) 中找到。

### 核心思想

从更高的抽象层次来看，**局部 SLAM 的工作是生成良好的子图**，**全局 SLAM 的工作是以最一致的方式将它们连接在一起**。

## 输入数据处理

### 测距传感器数据过滤

测距传感器（例如激光雷达）可以提供多个方向的深度信息。然而，并非所有测量值都对 SLAM 有意义。如果传感器部分被灰尘覆盖或指向机器人的某个特定部位，某些测量距离会成为 SLAM 的噪声。另一方面，一些远距离测量值可能来自不必要的来源（如反射、传感器噪声），同样对 SLAM 无益。

为了解决这些问题，Cartographer 首先应用带通滤波器，仅保留最小和最大范围之间的范围值。这些最小和最大值应根据机器人和传感器的规格选择。

```lua
TRAJECTORY_BUILDER_nD.min_range
TRAJECTORY_BUILDER_nD.max_range
```

> **注意：**
> - 在 2D 中，Cartographer 将超过 `max_range` 的范围替换为 `TRAJECTORY_BUILDER_2D.missing_data_ray_length`
> - 它还提供 `max_z` 和 `min_z` 值将 3D 点云过滤为 2D 切片
> - 在 Cartographer 配置文件中，所有距离都以米为单位定义

### 运动畸变处理

距离测量是在机器人实际运动的一段时间内进行的。然而，传感器以大型 ROS 消息的形式"批量"传递距离数据。Cartographer 可以独立考虑每条消息的时间戳，从而补偿机器人运动引起的畸变。Cartographer 获取测量值的频率越高，就越能更好地解除这些测量值的畸变，以组装出原本可瞬间捕获的单一连贯扫描。

因此，强烈建议在每次扫描（即可以与另一次扫描匹配的一组测距数据）中提供尽可能多的测距数据（ROS 消息）。

```lua
TRAJECTORY_BUILDER_nD.num_accumulated_range_data
```

### 体素滤波

测距数据通常是从机器人上的单个点进行多角度测量。这意味着近距离表面（例如道路）经常被探测到，从而产生大量点云。相反，远处的物体被探测到的次数较少，产生的点云也较少。

为了减少点云处理的计算量，我们通常需要对点云进行下采样。然而，简单的随机采样会移除一些原本测量密度就较低的区域的点云，而高密度区域的点云数量仍然过多。

为了解决密度问题，我们可以使用**体素滤波器**，将原始点下采样到恒定大小的立方体中，并仅保留每个立方体的质心。

- 较小的立方体尺寸会导致数据表示更加密集，从而增加计算量
- 较大的立方体尺寸会导致数据丢失，但速度会快得多

```lua
TRAJECTORY_BUILDER_nD.voxel_filter_size
```

### 自适应体素滤波

在应用固定大小的体素滤波器后，Cartographer 还会应用**自适应体素滤波器（adaptive voxel filter）**。该滤波器会尝试确定最佳体素大小（在最大长度限制内）以达到目标点数。

在 3D 空间中，使用两个自适应体素滤波器生成高分辨率和低分辨率点云，它们的用途将在[局部 SLAM](#局部-slam) 部分中阐明。

```lua
TRAJECTORY_BUILDER_nD.*adaptive_voxel_filter.max_length
TRAJECTORY_BUILDER_nD.*adaptive_voxel_filter.min_num_points
```

### IMU 数据使用

惯性测量单元（IMU）可以为 SLAM 提供有用的信息，因为它提供准确的重力方向（即地面方向）并总体上很好地表明了机器人的旋转情况（尽管存在噪声）。为了滤除 IMU 噪声，需要对重力进行一段时间的观测。

- 如果使用 2D SLAM，则可以实时处理距离数据，而无需额外的信息源，因此您可以选择是否让 Cartographer 使用 IMU。
- 使用 3D SLAM 时，需要提供 IMU，因为它被用作扫描方向的初始猜测，从而大大降低扫描匹配的复杂性。

```lua
TRAJECTORY_BUILDER_2D.use_imu_data
TRAJECTORY_BUILDER_nD.imu_gravity_time_constant
```

> **注意：** 在 Cartographer 配置文件中，所有时间值都以秒为单位定义

## 局部 SLAM

当完成扫描数据的组装和过滤后，即可执行局部 SLAM 算法。局部 SLAM 算法利用 **姿态外推器（pose extrapolator）** 提供的初始估计值，通过 **扫描匹配（scan matching）** 将新的扫描数据插入到当前构建的子图中。

姿态外推器的核心思想是利用测距传感器以外的其他传感器数据，来预测下一个扫描应该插入到子图中的位置。

### 扫描匹配策略

有两种扫描匹配策略可用：

#### 1. Ceres 扫描匹配器（CeresScanMatcher）

`CeresScanMatcher` 将初始猜测作为先验信息，并找到扫描与子图匹配的最佳位置。它通过对子图进行插值和对扫描进行亚像素对齐来实现。这种方法速度很快，但无法修复远大于子图分辨率的误差。

如果您的传感器设置和时序合理，仅使用 `CeresScanMatcher` 通常是最佳选择。

#### 2. 实时相关扫描匹配器（RealTimeCorrelativeScanMatcher）

如果您没有其他传感器或不信任它们，可以启用 `RealTimeCorrelativeScanMatcher`。它使用类似于回环分析中扫描与子图匹配的方法（稍后会详细介绍），但是它匹配的是当前子图。然后将最佳匹配结果用作 `CeresScanMatcher` 的先验信息。

这个扫描匹配器开销很大，基本上会覆盖除测距仪之外的其他传感器的任何信号，但它在特征丰富的环境中很稳健。

### Ceres 扫描匹配器权重配置

无论采用哪种方式，都可以配置 `CeresScanMatcher` 为其每个输入赋予一定的权重。权重是对数据信任度的度量，可以看作是静态协方差。

权重参数是无量纲量，不能相互比较。数据源的权重越大，Cartographer 在进行扫描匹配时就会越重视该数据源。

数据源包括：
- 已占用空间（来自扫描的点）
- 姿态外推器（或 `RealTimeCorrelativeScanMatcher`）的平移和旋转

```lua
TRAJECTORY_BUILDER_2D.ceres_scan_matcher.occupied_space_weight
TRAJECTORY_BUILDER_3D.ceres_scan_matcher.occupied_space_weight_0
TRAJECTORY_BUILDER_3D.ceres_scan_matcher.occupied_space_weight_1
TRAJECTORY_BUILDER_nD.ceres_scan_matcher.translation_weight
TRAJECTORY_BUILDER_nD.ceres_scan_matcher.rotation_weight
```

> **注意：** 在 3D 中，`occupied_space_weight_0` 和 `occupied_space_weight_1` 参数分别与高分辨率和低分辨率过滤点云相关。

### Ceres 求解器配置

`CeresScanMatcher` 的名称来自 [Ceres Solver](http://ceres-solver.org/)，这是 Google 开发的用于解决非线性最小二乘问题的库。扫描匹配问题被建模为此类问题的最小化，两次扫描之间的**运动**（变换矩阵）是待确定的参数。

Ceres 使用下降算法，在给定的迭代次数内优化该运动。可以配置 Ceres 以根据您自己的需要调整收敛速度。

```lua
TRAJECTORY_BUILDER_nD.ceres_scan_matcher.ceres_solver_options.use_nonmonotonic_steps
TRAJECTORY_BUILDER_nD.ceres_scan_matcher.ceres_solver_options.max_num_iterations
TRAJECTORY_BUILDER_nD.ceres_scan_matcher.ceres_solver_options.num_threads
```

### 实时相关扫描匹配器配置

可以根据您对传感器的信任程度切换 `RealTimeCorrelativeScanMatcher`。它的工作原理是在一个由最大距离半径和最大角度半径定义的搜索窗口中搜索相似的扫描数据。

在对该窗口中找到的扫描数据进行匹配时，您可以为平移和旋转分量选择不同的权重。例如，如果您知道您的机器人旋转幅度不大，则可以调整这些权重。

```lua
TRAJECTORY_BUILDER_nD.use_online_correlative_scan_matching
TRAJECTORY_BUILDER_nD.real_time_correlative_scan_matcher.linear_search_window
TRAJECTORY_BUILDER_nD.real_time_correlative_scan_matcher.angular_search_window
TRAJECTORY_BUILDER_nD.real_time_correlative_scan_matcher.translation_delta_cost_weight
TRAJECTORY_BUILDER_nD.real_time_correlative_scan_matcher.rotation_delta_cost_weight
```

### 运动过滤器

为了避免每个子图中插入过多扫描，一旦扫描匹配器找到两次扫描之间的运动，就会对其进行**运动过滤（motion filter）**。如果导致扫描的运动不被认为足够显著，则丢弃该扫描。

仅当扫描的运动超过一定的距离、角度或时间阈值时，才会将其插入当前子图。

```lua
TRAJECTORY_BUILDER_nD.motion_filter.max_time_seconds
TRAJECTORY_BUILDER_nD.motion_filter.max_distance_meters
TRAJECTORY_BUILDER_nD.motion_filter.max_angle_radians
```

### 子图完成条件

当局部 SLAM 接收到给定数量的距离数据时，子图被认为是完整的。

局部 SLAM 会随时间产生漂移，全局 SLAM 用于修正这种漂移。子图必须足够小，以确保其内部的漂移低于分辨率阈值，从而保证局部精度。另一方面，子图又必须足够大，以确保它们之间相互独立，从而使回环检测机制能够正常工作。

```lua
TRAJECTORY_BUILDER_nD.submaps.num_range_data
```

### 子图数据结构

子图可以以几种不同的数据结构存储其距离数据：

最广泛使用的表示称为**概率栅格（probability grids）**。然而，在 2D 中，也可以选择使用**截断有符号距离场（Truncated Signed Distance Fields, TSDF）**。

```lua
TRAJECTORY_BUILDER_2D.submaps.grid_options_2d.grid_type
```

#### 概率栅格

概率栅格将空间切割成二维或三维表格，其中每个单元格具有固定大小并包含被阻挡的几率。概率根据"*命中*"（测量距离数据的位置）和"*未命中*"（传感器和测量点之间的自由空间）进行更新。

命中和未命中在占用概率计算中可以具有不同的权重，从而赋予占用空间或空隙测量结果不同的可信度。

```lua
TRAJECTORY_BUILDER_2D.submaps.range_data_inserter.probability_grid_range_data_inserter.hit_probability
TRAJECTORY_BUILDER_2D.submaps.range_data_inserter.probability_grid_range_data_inserter.miss_probability
TRAJECTORY_BUILDER_3D.submaps.range_data_inserter.hit_probability
TRAJECTORY_BUILDER_3D.submaps.range_data_inserter.miss_probability
```

#### 2D vs 3D 概率栅格

- **2D**：每个子图仅存储一个概率栅格
- **3D**：出于扫描匹配性能原因，使用两个*混合*概率栅格（术语"混合"一词仅指内部的树状数据表示，对用户而言是抽象的）：
  - 用于远距离测量的低分辨率混合栅格
  - 用于近距离测量的高分辨率混合栅格

扫描匹配首先将低分辨率点云的远点与低分辨率混合栅格对齐，然后通过将近距离高分辨率点与高分辨率混合栅格对齐来细化位姿。

```lua
TRAJECTORY_BUILDER_2D.submaps.grid_options_2d.resolution
TRAJECTORY_BUILDER_3D.submaps.high_resolution
TRAJECTORY_BUILDER_3D.submaps.low_resolution
TRAJECTORY_BUILDER_3D.high_resolution_adaptive_voxel_filter.max_range
TRAJECTORY_BUILDER_3D.low_resolution_adaptive_voxel_filter.max_range
```

> **注意：** Cartographer ROS 提供了一个 RViz 插件来可视化子图。您可以从编号中选择要查看的子图。在 3D 模式下，RViz 仅显示 3D 混合概率栅格的 2D 投影（灰度）。RViz 左侧面板中提供了在低分辨率和高分辨率混合栅格可视化之间切换的选项。

**TODO**: *记录 TSDF 配置*

## 全局 SLAM

当局部 SLAM 生成子图序列时，全局优化任务（通常称为"*优化问题*"或"*稀疏位姿调整*"）会在后台线程中运行。其作用是重新排列各个子图，使它们形成一个连贯一致的全局地图。

例如，此优化负责调整当前构建的轨迹，以便根据回环闭合正确对齐子图。

### 优化频率

当插入一定数量的轨迹节点后，优化过程会分批运行。您可以根据需要运行优化的频率来调整这些批次的大小。

```lua
POSE_GRAPH.optimize_every_n_nodes
```

> **注意：** 将 `POSE_GRAPH.optimize_every_n_nodes` 设置为 0 是禁用全局 SLAM 并专注于局部 SLAM 行为的便捷方法。这通常是调优 Cartographer 时首先要做的事情之一。

### 位姿图优化

全局 SLAM 是一种"*GraphSLAM*"，它本质上是一种位姿图优化，通过在**节点**和子图之间构建**约束**，然后优化生成的约束图来工作。

可以将约束想象成连接所有节点的细绳。稀疏位姿调整将这些细绳固定在一起。最终生成的网络称为"*位姿图*"。

> **注意：** 约束可以在 RViz 中可视化，这对调优全局 SLAM 非常方便。还可以启用 `POSE_GRAPH.constraint_builder.log_matches` 以定期获得约束构建器的直方图报告。

### 约束类型

#### 非全局约束（局部约束）

非全局约束（也称为子图内约束）在轨迹上紧密相邻的节点之间自动构建。直观地说，这些"*非全局绳索*"保持了轨迹局部结构的连贯性。

#### 全局约束（回环约束）

全局约束（也称为回环约束或子图间约束）定期在新子图和被认为在空间上"足够接近"（**搜索窗口**的一部分）且匹配度高（运行扫描匹配时的良好匹配）的节点之间进行常规搜索。

直观地说，这些"*全局绳索*"在结构中引入"*结*"并牢固地将两股拉近。

```lua
POSE_GRAPH.constraint_builder.max_constraint_distance
POSE_GRAPH.fast_correlative_scan_matcher.linear_search_window
POSE_GRAPH.fast_correlative_scan_matcher_3d.linear_xy_search_window
POSE_GRAPH.fast_correlative_scan_matcher_3d.linear_z_search_window
POSE_GRAPH.fast_correlative_scan_matcher*.angular_search_window
```

> **注意：** 实际上，全局约束可以做的不仅仅是在单个轨迹上找到回环。它还可以对齐由多个机器人记录的不同轨迹，但本文将不讨论这种用法以及与"全局定位"相关的参数。

### 采样率

为了限制约束数量（和计算量），Cartographer 仅考虑所有近距离节点的下采样集合来构建约束。这由一个采样率常数控制。

采样节点太少可能导致错过约束和无效的回环。采样节点太多会减慢全局 SLAM 并阻止实时回环。

```lua
POSE_GRAPH.constraint_builder.sampling_ratio
```

### 快速相关扫描匹配器

当考虑将节点和子图用于约束构建时，它们会先经过一个称为 `FastCorrelativeScanMatcher` 的扫描匹配器。该扫描匹配器专门为 Cartographer 设计，使实时回环扫描匹配成为可能。

`FastCorrelativeScanMatcher` 依赖于"*分支定界*"机制在不同的栅格分辨率下工作，并能有效地消除错误匹配。该机制在本文档前面介绍的 Cartographer 论文中有详细介绍。它基于深度可控的探索树运行。

```lua
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.branch_and_bound_depth
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher_3d.branch_and_bound_depth
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher_3d.full_resolution_depth
```

一旦 `FastCorrelativeScanMatcher` 有了足够好的提议（高于最低匹配分数），它就会被馈送到 Ceres 扫描匹配器以细化位姿。

```lua
POSE_GRAPH.constraint_builder.min_score
POSE_GRAPH.constraint_builder.ceres_scan_matcher_3d
POSE_GRAPH.constraint_builder.ceres_scan_matcher
```

### 全局优化残差

当 Cartographer 运行*优化问题*时，使用 Ceres 根据多个*残差*重新排列子图。残差使用加权代价函数计算。

全局优化包含多个代价函数，以考虑多种数据源：
- 全局（回环）约束
- 非全局（匹配器）约束
- IMU 加速度和旋转测量值
- 局部 SLAM 粗略位姿估计
- 里程计源或固定坐标系（如 GPS 系统）

权重和 Ceres 选项的配置方法参见局部 SLAM 部分。

```lua
POSE_GRAPH.constraint_builder.loop_closure_translation_weight
POSE_GRAPH.constraint_builder.loop_closure_rotation_weight
POSE_GRAPH.matcher_translation_weight
POSE_GRAPH.matcher_rotation_weight
POSE_GRAPH.optimization_problem.*_weight
POSE_GRAPH.optimization_problem.ceres_solver_options
```

> **注意：** 可以通过切换 `POSE_GRAPH.log_residual_histograms` 找到有关优化问题中使用的残差的有用信息。

### IMU 外参标定

作为其 IMU 残差的一部分，优化问题允许 IMU 位姿有一定地灵活性，默认情况下，Ceres 可以自由地优化 IMU 和跟踪坐标系之间的外参标定。

如果您不信任 IMU 位姿，可以记录 Ceres 全局优化的结果并用于改进外参标定。如果 Ceres 没有正确优化您的 IMU 位姿并且您足够信任外参标定，可以使此位姿保持恒定。

```lua
POSE_GRAPH.optimization_problem.log_solver_summary
POSE_GRAPH.optimization_problem.use_online_imu_extrinsics_in_3d
```

### Huber 损失函数

在残差分析中，异常值的影响由配置了一定 Huber 尺度的 **Huber 损失函数**处理。Huber 尺度越大，（潜在）异常值的[影响就越大](https://github.com/ceres-solver/ceres-solver/blob/0d3a84fce553c9f7aab331f0895fa7b1856ef5ee/include/ceres/loss_function.h#L172)。

```lua
POSE_GRAPH.optimization_problem.huber_scale
```

### 最终优化

一旦轨迹完成，Cartographer 会运行一次新的全局优化，通常比以前的全局优化具有更多的迭代次数。这样做是为了优化 Cartographer 的最终结果，而且通常不需要实时运行，因此大量的迭代次数通常是正确的选择。

```lua
POSE_GRAPH.max_num_final_iterations
```

## 参考资源

- [Cartographer 论文](https://research.google.com/pubs/pub45466.html)
- [Ceres Solver](http://ceres-solver.org/)
- [配置文件示例](https://github.com/cartographer-project/cartographer/tree/master/configuration_files)
