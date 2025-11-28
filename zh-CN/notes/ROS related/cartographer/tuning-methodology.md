---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - 调优方法
---

# Cartographer 调优方法论

> 本文档翻译自 [Cartographer ROS - Tuning methodology](https://google-cartographer-ros.readthedocs.io/en/latest/tuning.html)
> 
> Apache License, Version 2.0

## 引言

不幸的是，调优 Cartographer 真的很困难。系统有许多参数，其中许多参数相互影响。本调优指南试图通过具体示例解释一种有原则的方法。

## 内置工具

Cartographer 提供了用于 SLAM 评估的内置工具，这些工具对于测量局部 SLAM 质量特别有用。它们是与核心 `cartographer` 库一起提供的独立可执行文件，因此是独立的，但与 `cartographer_ros` 兼容。

因此，请前往 [Cartographer 评估文档](https://google-cartographer.readthedocs.io/en/latest/evaluation.html) 以获取概念概述和实践使用工具的指南。

这些工具假设您已将 SLAM 状态序列化为 `.pbstream` 文件。使用 `cartographer_ros`，您可以调用 `assets_writer` 来序列化状态 - 有关更多信息，请参阅 [利用 Cartographer ROS 生成的地图](assets-writer.md) 部分。

## 示例：调优局部 SLAM

对于此示例，我们将从 `cartographer` 提交 [aba4575](https://github.com/cartographer-project/cartographer/commit/aba4575d937df4c9697f61529200c084f2562584) 和 `cartographer_ros` 提交 [99c23b6](https://github.com/cartographer-project/cartographer_ros/commit/99c23b6ac7874f7974e9ed808ace841da6f2c8b0) 开始，并查看测试数据集中的包 `b2-2016-04-27-12-31-41.bag`。

### 问题识别

在我们的初始配置中，我们在录制包的早期看到了一些滑动。录制包经过德意志博物馆的一个斜坡，这违反了平坦地板的 2D 假设。激光扫描数据表明，SLAM 系统接收到了相互矛盾的信息。但定位偏差也表明我们过于信任点云匹配，而忽略了其他传感器的数据。我们的目标是通过调优来改善这种情况。

如果我们只看这个特定的子图，错误完全限定在一个子图中。我们还看到，随着时间的推移，全局 SLAM 发现异常情况，并部分修正了它。但是损坏的子图永远无法修复。

由于这里的问题出现在了子图内的滑动，这是一个局部 SLAM 问题。所以让我们关闭全局 SLAM，以免干扰我们的调优。

```lua
POSE_GRAPH.optimize_every_n_nodes = 0
```

### 正确的子图大小

子图的大小通过 `TRAJECTORY_BUILDER_2D.submaps.num_range_data` 配置。查看此示例的各个子图，它们已经很好地满足了这两个约束条件，因此我们认为此参数已经调优良好。

### 调优 CeresScanMatcher

在我们的案例中，扫描匹配器可以自由地前后移动匹配结果，而不会影响得分。我们希望通过增加扫描匹配器偏离先验位置的代价来惩罚这种情况。

控制这一点的两个参数是：
- `TRAJECTORY_BUILDER_2D.ceres_scan_matcher.translation_weight`
- `TRAJECTORY_BUILDER_2D.ceres_scan_matcher.rotation_weight`

权重越高，将结果偏离先验位置的代价就越大，或者换句话说：扫描匹配器必须在其他位置生成更高的分数才能被接受。

出于教学目的，让我们使偏离先验的代价非常昂贵：

```lua
TRAJECTORY_BUILDER_2D.ceres_scan_matcher.translation_weight = 1e3
```

这允许优化器相当自由地覆盖扫描匹配器结果。这导致位姿接近先验，但与深度传感器不一致并且明显损坏。

尝试使用值 `2e2` 可以获得更好的结果。在这里，扫描匹配器虽然使用了旋转，但结果仍然略有偏差。将 `rotation_weight` 设置为 `4e2` 我们得到了一个合理的结果。

### 验证

为了确保我们没有针对这个特定问题过度调优，我们需要针对其他收集的数据运行配置。在这种情况下，新参数确实揭示了滑移现象，例如在 `b2-2016-04-05-14-44-52.bag` 的开头，因此我们不得不将 `translation_weight` 降低到 `1e2`。

这个设置对于我们想要修复的案例来说更糟，但不再滑动。在提交之前，我们对所有权重进行了归一化，因为它们只有相对意义。这次调优的结果是 [PR 428](https://github.com/cartographer-project/cartographer/pull/428)。

**一般来说，始终尝试为平台调优，而不是为特定的包调优。**

## 特殊情况

默认配置和上述调优步骤侧重于质量。只有在实现良好质量之后，我们才能进一步考虑特殊情况。

### 低延迟

低延迟是指在接收到传感器输入后不久（通常在一秒内）就可以获得优化的局部位姿，并且全局优化没有积压。低延迟对于机器人定位等在线算法至关重要。

在前台运行的局部 SLAM 会直接影响延迟。全局 SLAM 会建立一个后台任务队列。当全局 SLAM 无法处理队列中的任务时，漂移可能无限累积，因此全局 SLAM 需要进行调整以使其能够实时运行。

有许多选项可以调优不同组件的速度，我们按推荐的顺序列出它们，从直接的到更具侵入性的。建议一次只尝试一个选项，从第一个开始。配置参数请参阅 [Cartographer 文档](./official-config-reference.md)中。

#### 调优全局 SLAM 以降低延迟

为了优化全局 SLAM 以降低延迟，我们会降低其计算负载，直到它能够持续跟上实时输入。低于此阈值后，我们不再进一步降低计算负载，而是力求达到最佳质量。

要降低全局 SLAM 延迟，我们可以：

- 减少 `optimize_every_n_nodes`
- 增加 `MAP_BUILDER.num_background_threads` 直到核心数
- 减少 `global_sampling_ratio`
- 减少 `constraint_builder.sampling_ratio`
- 增加 `constraint_builder.min_score`
- 对于自适应体素滤波器，减少 `.min_num_points`、`.max_range`，增加 `.max_length`
- 增加 `voxel_filter_size`、`submaps.resolution`，减少 `submaps.num_range_data`
- 减少搜索窗口大小：`.linear_xy_search_window`、`.linear_z_search_window`、`.angular_search_window`
- 增加 `global_constraint_search_after_n_seconds`
- 减少 `max_num_iterations`

#### 调优局部 SLAM 以降低延迟

要降低局部 SLAM 延迟，我们可以：

- 增加 `voxel_filter_size`
- 增加 `submaps.resolution`
- 对于自适应体素滤波器，减少 `.min_num_points`、`.max_range`，增加 `.max_length`
- 减少 `max_range`（尤其是数据嘈杂时）
- 减少 `submaps.num_range_data`

**注意**：较大的体素会轻微增加扫描匹配分数作为副作用，因此应相应增加分数阈值。

### 给定地图中的纯定位

纯定位与建图不同。首先，我们期望局部和全局 SLAM 的延迟都更低。其次，全局 SLAM 通常会在作为地图的冻结轨迹和当前轨迹之间找到大量的相互约束。

#### 调优纯定位

1. 首先启用 `TRAJECTORY_BUILDER.pure_localization = true`
2. 大幅降低 `POSE_GRAPH.optimize_every_n_nodes` 以频繁获取结果
3. 使用这些设置，全局 SLAM 通常会太慢而无法跟上
4. 接下来，大幅降低 `global_sampling_ratio` 和 `constraint_builder.sampling_ratio` 以补偿大量的约束条件
5. 然后按照上面的说明调优以降低延迟，直到系统能够可靠地实时工作

**重要提示**：如果您运行 `pure_localization`，`submaps.resolution` **应该与** 您正在运行的 `.pbstream` 中子图的分辨率**匹配**。使用不同的分辨率目前未经测试，可能无法按预期工作。

### 全局优化中的里程计

如果单独的里程计源用作局部 SLAM 的输入（`use_odometry = true`），我们还可以调优全局 SLAM 以从这些附加信息中受益。

总共有四个参数允许我们调优局部 SLAM 和里程计在优化中的各个权重：

```lua
POSE_GRAPH.optimization_problem.local_slam_pose_translation_weight
POSE_GRAPH.optimization_problem.local_slam_pose_rotation_weight
POSE_GRAPH.optimization_problem.odometry_translation_weight
POSE_GRAPH.optimization_problem.odometry_rotation_weight
```

我们可以根据我们对局部 SLAM 或里程计的信任程度来设置这些权重。默认情况下，里程计在全局优化中的权重类似于局部 SLAM（扫描匹配）位姿。

然而，来自轮式编码器的里程计通常在旋转方面具有较高的不确定性。在这种情况下，可以减少旋转权重，甚至可以降低到零。

## 仍然有问题？

如果您无法让 Cartographer 在您的数据上可靠地工作，可以开一个 [GitHub issue](https://github.com/cartographer-project/cartographer_ros/issues) 寻求帮助。开发人员很乐意提供帮助，但只有在您遵循[问题模板](https://github.com/cartographer-project/cartographer_ros/issues/new?labels=question)时才能提供帮助，该模板包含：

- `rosbag_validate` 的结果
- 指向包含您配置的 `cartographer_ros` 分支的链接
- 指向重现问题的 `.bag` 文件的链接

> **注意**：已经有很多 GitHub 问题，开发人员解决了各种问题。浏览 [cartographer_ros 的已关闭问题](https://github.com/cartographer-project/cartographer_ros/issues?q=is%3Aissue+is%3Aclosed)和 [cartographer 的已关闭问题](https://github.com/cartographer-project/cartographer_ros/issues?q=is%3Aissue+is%3Aclosed)是了解更多关于 Cartographer 的好方法，也许可以找到您问题的解决方案！

## 参考资源

- [Cartographer 评估文档](https://google-cartographer.readthedocs.io/en/latest/evaluation.html)
- [Cartographer 配置文档](https://google-cartographer.readthedocs.io/en/latest/configuration.html)
- [PR 428](https://github.com/cartographer-project/cartographer/pull/428) - 示例调优提交
- [GitHub Issues](https://github.com/cartographer-project/cartographer_ros/issues)
