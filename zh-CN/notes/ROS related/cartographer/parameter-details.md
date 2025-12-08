---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 实战指南
  - 参数调优
comment: true
---

# Cartographer 参数实战调优指南

> [!NOTE]
> 本文档基于实战经验，提供 Cartographer 参数调优的实用指南
> 
> 配合官方参数文档使用效果更佳

## 文档导航

本文档是 Cartographer 文档体系的一部分，建议配合以下文档阅读：

- **[官方配置参数参考](config-reference.md)** - 完整的参数列表和定义
- **[ROS Lua 配置参考](ros-lua-config-reference.md)** - ROS 集成配置说明
- **[算法调优指南](ros-algo-walkthrough.md)** - 算法原理和调优理论
- **[调优方法论](ros-tuning-methodology.md)** - 系统化的调优方法
- **[FAQ](ros-faq.md)** - 常见问题解答

## 1. 引言

Cartographer 的参数调整对建图和定位都有很大的影响。本文档旨在提供**实用的调参指南**，不仅介绍各个参数的作用，更重要的是说明：

- 调整参数时需要考虑的因素
- 调整后会产生什么影响
- 如何根据实际情况选择参数值
- 常见问题的解决方案

### 1.1 文档结构

- **第 2-3 节**：Cartographer 架构和传感器作用
- **第 4 节**：传感器参数配置详解
- **第 5 节**：前端参数调整（重点）
- **第 6 节**：后端参数调整
- **第 7 节**：3D SLAM 特殊考虑
- **第 8 节**：参数速查表
- **第 9 节**：调参实战指南
- **第 10 节**：常见问题与解决方案

### 1.2 参数文件位置

参数文件分别散落在 `cartographer` 和 `cartographer_ros` 两个项目里：

**Cartographer 核心参数**：`cartographer/configuration_files/`
- `trajectory_builder_2d.lua` - 2D 轨迹构建器配置
- `trajectory_builder_3d.lua` - 3D 轨迹构建器配置
- `pose_graph.lua` - 位姿图优化配置
- `map_builder.lua` - 地图构建器配置

**Cartographer ROS 参数**：`cartographer_ros/configuration_files/`
- 各种示例配置文件（backpack_2d.lua、backpack_3d.lua 等）

## 2. Cartographer 架构与数据流

### 2.1 传感器概述

Cartographer 接收的传感器数据主要有三种：
- **激光雷达**：主导传感器，用于建图的核心数据源
- **IMU**：辅助传感器，提供角速度信息
- **里程计**：辅助传感器，提供线速度信息

实际使用中，最好三种传感器一起使用。IMU 和里程计少了任意一个，建图效果都会不理想，这是由于 Cartographer 对多传感器融合的实现较为简单粗暴导致的。

### 2.2 前端与后端的职责划分

**前端部分**主要负责：
- 点云匹配
- 生成 Submap（子图）

**后端部分**主要负责：
- 全局优化
- 消除累计误差

## 3. 传感器在前端和后端中的作用

### 3.1 前端部分

#### 激光雷达
- 点云直接用于生成 Submap，第一帧点云初始化第一幅 Submap
- 后续点云与当前生成中的 Submap 进行 scan-to-map 的匹配，用于估算每一帧点云的位移
- 匹配的位移也用于下一帧点云匹配前的位姿推算
- Cartographer 会根据两次匹配位姿的距离和时间差估算角速度和线速度，用于计算下一帧点云可能的位置
- 新来的点云就直接在预估位置附近做匹配

#### IMU
- 参与下一个时间点的位姿估算
- 当输入 IMU 数据后，点云匹配前将会用 IMU 的角速度和匹配位姿的线速度来估算下一帧点云可能的位置

#### 里程计
- 参与下一个时间点的位姿估算
- 当提供里程计数据后，不再使用匹配位姿来估算线速度
- 直接用里程计的线速度和 IMU 的角速度来估算下一帧点云可能的位置

### 3.2 后端部分

#### 激光雷达
后端的主要作用有两个：
1. scan-to-map 匹配做回环检测
2. 前端产生的匹配位姿之间的相对位姿作为约束参与后端的全局优化
- 优化的目的是为了尽可能消除累计误差

#### IMU
- 2D SLAM 时 IMU 数据在后端没有任何作用
- 3D SLAM 时 IMU 用于测量重力方向和姿态估计

#### 里程计
- 使用两帧里程计数据的相对位姿作为约束参与后端优化
- 里程计数据短时间内必须足够准确，否则得到的相对位姿误差大，会导致全局优化出来的地图效果更差

## 4. 传感器参数配置详解

### 4.1 激光雷达参数

#### 运动畸变矫正参数

**参数：** `num_subdivisions_per_laser_scan` 和 `num_accumulated_range_data`

**作用：**
- `num_subdivisions_per_laser_scan`：将一帧点云切成 N 份，然后均匀估算每一份的时间戳
- `num_accumulated_range_data`：将 N 份点云合并成 1 份

**示例：**
```lua
options = {
  ...
  num_subdivisions_per_laser_scan = 1, -- 指定将一帧点云切成 N 份，然后均匀估算每一份的时间戳，一般为 1
  ...
}

TRAJECTORY_BUILDER_2D.num_accumulated_range_data = 1 -- 将 N 份点云合并成 1 份
```

**工作原理：**
合并过程中会根据每一份点云的时间戳估算它应该在的位置和角度。

**重要提示：**
- 运动畸变矫正非常依赖里程计和 IMU
  - 里程计估算线速度
  - IMU 估算角速度
- 如果没有接入这两个传感器，或者其中一个的精度非常差，**最好把畸变矫正关闭**
- 关闭方法：把两个参数都设置成 `1`
- 不当的矫正会比不矫正的偏差还大
- 关闭运动畸变后，需要在建图时尽可能慢速移动，让雷达扫描不会产生太大的畸变，从而减少累计误差提高建图质量

#### 有效距离限制

**参数：** `TRAJECTORY_BUILDER_2D.min_range` 和 `TRAJECTORY_BUILDER_2D.max_range`

**作用：**
- `min_range`：过滤掉雷达周围的遮挡物
- `max_range`：限制点云的最大有效距离

**示例：**
```lua
-- 用于限制点云的有效距离
TRAJECTORY_BUILDER_2D.min_range = 0.15
TRAJECTORY_BUILDER_2D.max_range = 5.0
```

**调参技巧：**
- `max_range` 不是越大越好
  - 过大会增加计算量
  - 测量距离较远时噪声变大
  - 点间距稀疏会带来更多的累计误差
  - 影响建图质量
- 建议：在目标工作场景下录个包，反复测试观察不影响 scan-to-map 匹配的最小距离作为参数值
- 验证方法：观察雷达移动后 Cartographer 匹配的点云位置有没有做出相应的移动

#### 体素滤波

**参数：** `voxel_filter_size`

**作用：**
- 降低点云密度
- 限制两个点之间的最小距离

**示例：**
```lua
-- 体素滤波的大小设置，用来降低点云密度
TRAJECTORY_BUILDER_2D.voxel_filter_size = 0.05
```

**效果：**
- 调大可以降低计算量，但建图质量也会降低
- 常用值：`0.025`（2.5cm）或 `0.05`（5cm）

#### 点云输入频率限制

**参数：** `rangefinder_sampling_ratio`

**作用：**
- 限制点云数据输入频率
- 一般维持在 12Hz 左右的输入就好

**示例：**
```lua
options = {
  ...
  rangefinder_sampling_ratio = 1., -- 点云数据输入频率限制
  ...
}
```

**调参技巧：**
- 如果雷达输出频率为 30Hz，可以将此参数设置为 `0.33`，仅保留 33% 的输入
- 如果机器内存和算力充足，越大越好
- 根据实际情况调整

### 4.2 里程计参数

**参数：** `use_odometry`

**作用：**
- 打开里程计数据输入

**示例：**
```lua
options = {
  ...
  use_odometry = true, -- 是否使用里程计，如果使用要求一定要有 odom 的 tf
  ...
}
```

**传感器选型建议：**
- 关注短时间内的精度
- 里程计的广义定义：不一定只能是轮式里程计
  - 可以是视觉 SLAM 框架输出的位姿
  - 任何格式和表现形式与轮式里程计一样的数据都可以

### 4.3 IMU 参数

**参数：** `TRAJECTORY_BUILDER_2D.use_imu_data`

**示例：**
```lua
TRAJECTORY_BUILDER_2D.use_imu_data = false -- 打开 IMU 数据输入
```

**作用：**
- 打开 IMU 数据输入

**传感器选型建议：**
- IMU 数据只使用了角速度来估计旋转运动
- 可以选择对旋转有着高精度测量的任意惯性器件
- 线速度的测量精度可以不在意

**注意：**
- 3D SLAM 中 IMU 是必需的
- 2D SLAM 中 IMU 是可选的

## 5. 前端参数调整

参数配置文件：`trajectory_builder_2d.lua`

### 5.1 调参前的准备工作

在调整前端参数之前，**最好先关闭后端**，方便观察参数调整后对建图的直接影响。

**关闭后端的方法：**
将以下三个参数设置成 0：

```lua
-- 可以将下面三个参数设置成 0 来关闭后端
POSE_GRAPH.optimize_every_n_nodes = 0
POSE_GRAPH.constraint_builder.sampling_ratio = 0
POSE_GRAPH.global_sampling_ratio = 0
```

### 5.2 Submap 生成参数

#### 核心参数：submaps.num_range_data

这是前端中**最重要的参数**，决定了用多少帧点云来构造一幅 Submap。

**Submap 的概念：**
- Submap 是基于图优化的 SLAM 算法的精髓
- 使用很多幅 Submap 来构成一幅大地图
- 每个 Submap 包含若干个 Node，每个 Node 就是一帧点云
- 建图过程中的累计误差通过后端的图优化算法调整每一副 Submap 的位姿来消除，让整体地图形成最优

**示例：**
```lua
-- 用多少帧点云来构造一副 Submap，取值越小，每一副 Submap 内的累计误差就会越小
TRAJECTORY_BUILDER_2D.submaps.num_range_data = 90
```

#### 参数取值策略

**推荐值：** 30 / 60 / 90

取值需要从两个角度考虑：

**1. 累计误差角度**

累计误差来源：
- 点云匹配误差
- 传感器误差

策略：
- 参数值越小，每一副 Submap 内的累计误差就会越小
- 如果传感器质量很差，建议设置成 **30**
  - 让前端生成尽可能多的 Submap
  - 每一副 Submap 的累计误差尽可能少
  - 后端参数调得合适，最终得到的地图质量就是最好的
- 如果传感器质量非常好，可以设置成 **90**
  - 既不影响建图质量
  - 也能降低计算资源需求

**2. 性能角度**

考虑因素：
- 参数值越小，生成的 Submap 越多
  - 需要消耗更多内存
  - 后端优化需要更多算力
- 如果 CPU 性能不够
  - 会让整个 SLAM 算法无法实时运行
  - 建图和定位都会出现延迟

### 5.3 点云匹配器参数

前端中有两个匹配器：
1. **Real Time Correlative Scan Match (RTCSM)**
2. **Ceres Scan Match**

#### Real Time Correlative Scan Match

**开关参数：** `use_online_correlative_scan_matching`

**示例：**
```lua
TRAJECTORY_BUILDER_2D.use_online_correlative_scan_matching = true -- RTCSM 匹配器开关
```

**作用：**
- 在 Submap 构建流程中的第一个匹配器
- 用于较大范围较粗略的搜索点云在 Submap 上的位置
- 目的是尽可能消除传感器带来的误差

**工作原理：**
- 在点云匹配前，Cartographer 会利用先前的位姿加上 IMU 和里程计的角速度线速度来预测当前点云可能的位置
- 如果里程计和 IMU 质量比较差，很可能预测出错误的结果
- 导致第二个匹配器在有限的迭代步骤内无法匹配出正确的位姿
- 从而给 Submap 带来点云匹配的累计误差

**误差特征：**
- 因为匹配失败带来的误差是无法消除的
- 一旦插入了 Submap，就会永远出现在地图上
- 表现为一面墙在地图上有两条黑线或者很糊很厚

**使用建议：**
- 在 IMU 和里程计不可靠或者没有这两个传感器的情况下，最好打开 `use_online_correlative_scan_matching`

#### 搜索窗口参数

**关键参数：**
- `real_time_correlative_scan_matcher.linear_search_window`（单位：米）
- `real_time_correlative_scan_matcher.angular_search_window`（单位：弧度）

**示例：**
```lua
TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.linear_search_window = 1  -- 在预测位置的平移半径内进行搜索，单位是米
TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.angular_search_window = math.rad(90)  -- 在预测位置的旋转角度范围内进行搜索，单位是弧度
```

**作用：**
指定 RTCSM 在预测位置的平移半径和旋转角度范围内进行搜索

**调参原则：**
- 搜索窗口在保证可靠性的情况下越小越好
- 过大会导致计算耗时非常久，前端无法实时更新

#### 搜索窗口调参技巧

**推荐方法：**

1. 先把两个值都设置得很大
   - 例如：`linear_search_window = 1`
   - 例如：`angular_search_window = math.rad(90)`

2. 修改 Cartographer 源码
   - 位置：`local_trajectory_builder_2d.cc` 里的 `AddAccumulatedRangeData` 函数
   - 记录函数内的预测位姿 `pose_prediction` 和最终匹配位姿 `pose_estimate_2d`

3. 建图完成后计算
   - 计算全部预测位姿和匹配位姿中的最大距离差和角度差
   - 把这个差值作为两个搜索窗口的参数值

**性能优化：**
- 如果 IMU 和里程计都非常可靠，精度非常高
- 预测位姿和匹配位姿的差很小很小
- 可以尝试关闭 RTCSM 匹配器，节约计算资源

## 6. 后端参数调整

参数配置文件：`pose_graph.lua`

### 6.1 后端优化频率

**参数：** `POSE_GRAPH.optimize_every_n_nodes`

**示例：**
```lua
POSE_GRAPH.optimize_every_n_nodes = 30
```

**作用：**
- 控制全局优化的频率
- 每插入 N 个节点后执行一次优化

**调参策略：**

**高质量建图模式（离线）：**
- 推荐值：`90` 或更大
- 优点：优化更充分，地图质量更好
- 缺点：计算量大，可能不实时

**实时建图模式（在线）：**
- 推荐值：`30-60`
- 平衡实时性和地图质量

**纯定位模式：**
- 推荐值：`5-10`
- 需要快速响应回环

**调试模式：**
- 设置为 `0` 关闭后端优化
- 方便观察前端参数的直接影响

### 6.2 约束构建参数

#### 采样率控制

**参数：**
- `POSE_GRAPH.constraint_builder.sampling_ratio`
- `POSE_GRAPH.global_sampling_ratio`

**示例：**
```lua
POSE_GRAPH.constraint_builder.sampling_ratio = 0.3
POSE_GRAPH.global_sampling_ratio = 0.01
```

**作用：**
- 控制用于构建约束的节点采样比例
- 降低计算量

**调参策略：**
- `sampling_ratio`：局部约束采样，推荐 `0.3`
- `global_sampling_ratio`：全局约束采样，推荐 `0.003-0.01`
- 纯定位模式：两者都应大幅降低（如 `0.01` 和 `0.0001`）

#### 约束搜索窗口

**参数：**
```lua
POSE_GRAPH.constraint_builder.max_constraint_distance
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.linear_search_window
POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.angular_search_window
```

**调参策略：**
- `max_constraint_distance`：约束最大距离，2D 推荐 `15m`，3D 推荐 `15m`
- `linear_search_window`：线性搜索窗口，推荐 `7m`
- `angular_search_window`：角度搜索窗口，推荐 `30度`（`math.rad(30)`）

**性能优化：**
- 减小搜索窗口可以提升速度
- 但可能错过回环机会
- 根据场景大小调整

### 6.3 优化问题权重

**关键参数：**
```lua
POSE_GRAPH.optimization_problem.huber_scale
POSE_GRAPH.optimization_problem.odometry_translation_weight
POSE_GRAPH.optimization_problem.odometry_rotation_weight
POSE_GRAPH.optimization_problem.local_slam_pose_translation_weight
POSE_GRAPH.optimization_problem.local_slam_pose_rotation_weight
```

**调参策略：**

**使用里程计时：**
- 如果里程计很准确：
  - `odometry_translation_weight = 1e2`
  - `odometry_rotation_weight = 1e2`
- 如果里程计旋转不准（轮式编码器常见）：
  - `odometry_rotation_weight = 0` 或很小的值
  - `odometry_translation_weight = 1e2`

**局部 SLAM 权重：**
- 默认值通常就很好：
  - `local_slam_pose_translation_weight = 1e5`
  - `local_slam_pose_rotation_weight = 1e5`

**Huber 损失函数：**
- `huber_scale`：控制异常值影响
- 2D 推荐：`1e1`
- 3D 推荐：`5e1`
- 值越大，异常值影响越大

### 6.4 回环检测参数

**参数：**
```lua
POSE_GRAPH.constraint_builder.min_score
POSE_GRAPH.constraint_builder.loop_closure_translation_weight
POSE_GRAPH.constraint_builder.loop_closure_rotation_weight
```

**调参策略：**

**匹配分数阈值：**
- `min_score`：回环检测的最小匹配分数
- 2D 推荐：`0.55`
- 3D 推荐：`0.55`
- 提高可以减少误匹配，但可能错过真实回环

**回环约束权重：**
- `loop_closure_translation_weight = 1.1e4`
- `loop_closure_rotation_weight = 1e5`
- 调大会增强回环约束的作用

## 7. 3D SLAM 特殊考虑

### 7.1 IMU 的必要性

**在 3D SLAM 中 IMU 是必需的：**
- 用于测量重力方向
- 提供初始姿态估计
- 大幅降低扫描匹配复杂度

**关键参数：**
```lua
TRAJECTORY_BUILDER_3D.imu_gravity_time_constant = 10
```

### 7.2 双分辨率点云

**3D 使用两个分辨率的混合栅格：**
```lua
TRAJECTORY_BUILDER_3D.submaps.high_resolution = 0.10
TRAJECTORY_BUILDER_3D.submaps.low_resolution = 0.45
TRAJECTORY_BUILDER_3D.high_resolution_adaptive_voxel_filter.max_range = 15
TRAJECTORY_BUILDER_3D.low_resolution_adaptive_voxel_filter.max_range = 60
```

**调参策略：**
- 高分辨率用于近距离匹配（15m 内）
- 低分辨率用于远距离匹配（60m 内）
- 根据传感器最大量程调整

### 7.3 旋转权重

**3D 中旋转自由度更多：**
```lua
TRAJECTORY_BUILDER_3D.ceres_scan_matcher.rotation_weight = 4e2
```

**调参建议：**
- 通常需要比 2D 更高的旋转权重
- 防止在垂直方向上的漂移

## 8. 参数速查表

### 8.1 传感器配置速查

| 参数 | 2D 推荐值 | 3D 推荐值 | 说明 |
|------|----------|----------|------|
| `min_range` | 0.3 | 0.3 | 最小有效距离（米） |
| `max_range` | 25 | 25-60 | 最大有效距离（米） |
| `voxel_filter_size` | 0.025-0.05 | 0.05-0.10 | 体素滤波尺寸（米） |
| `num_accumulated_range_data` | 1-10 | 160 | 累积点云帧数 |
| `use_imu_data` | false/true | true | 是否使用 IMU（3D 必需） |
| `use_odometry` | true | true | 是否使用里程计 |
| `rangefinder_sampling_ratio` | 0.3-1.0 | 0.3-1.0 | 点云采样率 |

### 8.2 前端参数速查

| 参数 | 低质量传感器 | 高质量传感器 | 说明 |
|------|------------|------------|------|
| `submaps.num_range_data` | 30 | 90 | 子图包含点云帧数 |
| `submaps.resolution` (2D) | 0.05 | 0.05 | 子图分辨率（米） |
| `use_online_correlative_scan_matching` | true | false | 是否使用实时相关匹配 |
| `real_time_correlative_scan_matcher.linear_search_window` | 0.2 | 0.1 | 线性搜索窗口（米） |
| `real_time_correlative_scan_matcher.angular_search_window` | 0.35 | 0.2 | 角度搜索窗口（弧度） |
| `ceres_scan_matcher.translation_weight` | 1e2 | 1e2 | 平移权重 |
| `ceres_scan_matcher.rotation_weight` | 4e2 | 4e2 | 旋转权重 |

### 8.3 后端参数速查

| 参数 | 实时模式 | 离线模式 | 纯定位 | 说明 |
|------|---------|---------|--------|------|
| `optimize_every_n_nodes` | 30-60 | 90 | 5-10 | 优化频率 |
| `constraint_builder.sampling_ratio` | 0.3 | 0.3 | 0.01 | 约束采样率 |
| `global_sampling_ratio` | 0.003 | 0.003 | 0.0001 | 全局采样率 |
| `constraint_builder.min_score` | 0.55 | 0.65 | 0.55 | 回环检测分数阈值 |
| `constraint_builder.max_constraint_distance` | 15 | 15 | 15 | 约束最大距离（米） |
| `max_num_final_iterations` | 200 | 400 | 200 | 最终优化迭代次数 |

### 8.4 性能优化速查

**降低延迟：**
```lua
# 减少优化频率
optimize_every_n_nodes = 更大的值

# 降低采样率
constraint_builder.sampling_ratio = 更小的值
global_sampling_ratio = 更小的值

# 增大体素尺寸
voxel_filter_size = 更大的值

# 降低分辨率
submaps.resolution = 更大的值 (2D)
submaps.high_resolution = 更大的值 (3D)

# 降低点云输入频率
rangefinder_sampling_ratio = 更小的值
```

**提高质量：**
```lua
# 增加优化频率
optimize_every_n_nodes = 更小的值

# 减小子图大小
submaps.num_range_data = 更小的值

# 提高分辨率
submaps.resolution = 更小的值 (2D)
submaps.high_resolution = 更小的值 (3D)

# 增加最终优化迭代
max_num_final_iterations = 更大的值
```

## 9. 调参实战指南

### 9.1 调参流程建议

**步骤 1：评估传感器质量**
- 检查激光雷达、IMU、里程计的精度
- 确定是否需要运动畸变矫正
- 记录传感器的技术规格

**步骤 2：设置基础参数**
- 配置传感器输入（激光雷达、IMU、里程计）
- 设置有效距离范围
- 配置体素滤波尺寸

**步骤 3：调整前端参数**
- 关闭后端（设置 `optimize_every_n_nodes = 0`）
- 调整 `submaps.num_range_data`
- 配置点云匹配器参数
- 观察建图效果

**步骤 4：调整后端参数**
- 重新打开后端
- 设置优化频率
- 调整约束构建参数
- 配置回环检测参数

**步骤 5：迭代测试与验证**
- 录制测试包
- 反复调整参数
- 观察建图效果
- 记录最佳参数组合

### 9.2 调参技巧

#### 1. 从默认值开始
- 先使用官方示例配置
- 在此基础上逐步调整
- 每次只调整一个参数

#### 2. 建立测试流程
- 录制标准测试包
- 包含各种典型场景
- 方便对比不同参数的效果

#### 3. 关注关键指标
- 地图一致性
- 回环成功率
- 计算延迟
- 内存占用

#### 4. 记录调参过程
- 记录每次调整的参数
- 记录对应的效果
- 建立参数调整日志

## 10. 常见问题与解决方案

### 10.1 地图重影（墙体出现双线）

**症状：**
- 一面墙在地图上有两条黑线或者很糊很厚
- 表明扫描匹配失败

**原因：**
- 点云匹配失败导致的累计误差
- IMU/里程计不可靠导致位姿预测错误
- RTCSM 匹配器未启用或搜索窗口太小

**解决方案：**
1. 打开 RTCSM 匹配器：
   ```lua
   TRAJECTORY_BUILDER_2D.use_online_correlative_scan_matching = true
   ```

2. 增大搜索窗口：
   ```lua
   TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.linear_search_window = 0.2
   TRAJECTORY_BUILDER_2D.real_time_correlative_scan_matcher.angular_search_window = math.rad(30)
   ```

3. 降低移动速度进行建图

4. 改善传感器质量或校准传感器

### 10.2 建图延迟

**症状：**
- SLAM 算法无法实时运行
- 建图和定位都出现延迟
- CPU 占用率持续 100%

**原因：**
- 计算资源不足
- 参数配置过于精细
- 点云数据量过大

**解决方案：**
1. 增大子图大小：
   ```lua
   TRAJECTORY_BUILDER_2D.submaps.num_range_data = 90  -- 从30增加到90
   ```

2. 降低点云输入频率：
   ```lua
   options = {
      ...
      rangefinder_sampling_ratio = 0.33, -- 降低到33%
      ...
   }
   ```

3. 增大体素滤波尺寸：
   ```lua
   TRAJECTORY_BUILDER_2D.voxel_filter_size = 0.05  -- 从0.025增加到0.05
   ```

4. 降低后端优化频率：
   ```lua
   POSE_GRAPH.optimize_every_n_nodes = 90  -- 增大优化间隔
   ```

5. 降低约束采样率：
   ```lua
   POSE_GRAPH.constraint_builder.sampling_ratio = 0.1
   POSE_GRAPH.global_sampling_ratio = 0.001
   ```

### 10.3 累计误差过大

**症状：**
- 建图过程中地图逐渐偏移
- 回环时无法正确匹配
- 整体地图扭曲

**原因：**
- Submap 包含帧数过多
- 传感器质量差
- 移动速度过快
- 运动畸变未正确处理

**解决方案：**
1. 减小子图大小：
   ```lua
   TRAJECTORY_BUILDER_2D.submaps.num_range_data = 30  -- 减少到30
   ```

2. 如果传感器质量差，关闭运动畸变矫正：
   ```lua
   options = {
      ...
      num_subdivisions_per_laser_scan = 1,
      ...
   }
   TRAJECTORY_BUILDER_2D.num_accumulated_range_data = 1
   ```

3. 降低移动速度

4. 改善传感器质量

5. 增加优化频率：
   ```lua
   POSE_GRAPH.optimize_every_n_nodes = 30
   ```

### 10.4 回环检测失败

**症状：**
- 回到起点时无法识别
- 后端无法消除累计误差
- 地图存在明显重复

**原因：**
- 回环检测阈值过高
- 搜索窗口过小
- 采样率过低

**解决方案：**
1. 降低匹配分数阈值：
   ```lua
   POSE_GRAPH.constraint_builder.min_score = 0.45  -- 从0.55降低到0.45
   ```

2. 增大搜索窗口：
   ```lua
   POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.linear_search_window = 10
   POSE_GRAPH.constraint_builder.fast_correlative_scan_matcher.angular_search_window = math.rad(45)
   ```

3. 增加采样率：
   ```lua
   POSE_GRAPH.global_sampling_ratio = 0.01  -- 提高全局采样率
   ```

### 10.5 IMU 数据异常

**症状：**
- 地图旋转异常
- 位姿估计不稳定
- 建图质量很差

**原因：**
- IMU 未正确校准
- IMU 坐标系配置错误
- IMU 数据噪声过大

**解决方案：**
1. 2D SLAM 中可以尝试关闭 IMU：
   ```lua
   TRAJECTORY_BUILDER_2D.use_imu_data = false
   ```

2. 检查并正确配置 IMU 坐标系

3. 校准 IMU 传感器

4. 3D SLAM 中 IMU 是必需的，必须解决 IMU 问题

### 10.6 里程计数据异常

**症状：**
- 位姿预测偏差很大
- 扫描匹配经常失败
- 后端优化后地图质量变差

**原因：**
- 里程计不准确
- 里程计坐标系配置错误
- 短时间内累计误差大

**解决方案：**
1. 降低里程计权重：
   ```lua
   POSE_GRAPH.optimization_problem.odometry_translation_weight = 1e1  -- 降低权重
   POSE_GRAPH.optimization_problem.odometry_rotation_weight = 0  -- 轮式编码器旋转不可靠
   ```

2. 尝试不使用里程计：
   ```lua
   options = {
      ...
      use_odometry = false,
      ...
   }
   ```

3. 校准或更换里程计传感器

4. 打开 RTCSM 匹配器补偿里程计误差

## 11. 总结

Cartographer 的参数调整需要综合考虑传感器质量、运行平台性能和实际应用场景。通过理解每个参数的作用机制和调整策略，可以针对性地优化建图效果。

### 关键要点

1. **没有万能的参数配置**
   - 需要根据实际情况不断测试调整
   - 不同场景可能需要不同的参数

2. **前端和后端参数需要配合优化**
   - 前端负责局部精度
   - 后端负责全局一致性
   - 两者需要平衡

3. **传感器质量是建图质量的基础**
   - 好的传感器可以使用更简单的参数
   - 差的传感器需要更精细的调参
   - 必要时需要改善或更换传感器

4. **性能和质量需要权衡**
   - 实时系统需要降低计算量
   - 离线系统可以追求最佳质量
   - 根据应用场景选择优先级

5. **系统化调参**
   - 建立标准测试流程
   - 记录调参过程和结果
   - 逐步迭代优化

## 12. 参考资源

### 官方文档
- [Cartographer 官方文档](https://google-cartographer.readthedocs.io/)
- [官方配置参数参考](config-reference.md)
- [ROS Lua 配置参考](ros-lua-config-reference.md)
- [算法调优指南](ros-algo-walkthrough.md)
- [调优方法论](ros-tuning-methodology.md)

### 源码
- `cartographer` 项目：核心 SLAM 算法
- `cartographer_ros` 项目：ROS 集成
- 参数配置文件：`trajectory_builder_2d.lua`、`pose_graph.lua`

### 社区资源
- [一点Cartographer的调参心得：传感器篇](https://www.bilibili.com/opus/823426113734705220)
- [一点Cartographer的调参心得：前端篇](https://www.bilibili.com/opus/825655910190809126)
- [Cartographer GitHub Issues](https://github.com/cartographer-project/cartographer/issues)
- [Cartographer ROS GitHub Issues](https://github.com/cartographer-project/cartographer_ros/issues)

### 相关工具
- [Assets Writer](ros-assets-writer.md) - 地图导出和可视化
- [高级功能](ros-advanced-features.md) - 多传感器输入、纯定位等
