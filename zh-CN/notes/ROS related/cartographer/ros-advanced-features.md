---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - 高级功能
---

# Cartographer 高级功能

> 本文档翻译自 [Cartographer 高级功能官方文档](https://google-cartographer-ros.readthedocs.io/en/latest/going_further.html)
> 
> Apache License, Version 2.0

## 概述

Cartographer 不仅是一个出色的 SLAM 算法，它还附带了一个功能齐全的实现，提供了许多"额外"功能。本页列出了一些不太为人所知的功能。

## 更多输入源

### 里程计输入

如果您有里程计源（例如轮式编码器）在 `nav_msgs/Odometry` 话题上发布，并希望使用它来改进 Cartographer 的定位，可以在 `.lua` 配置文件中添加输入：

```lua
use_odometry = true
```

消息将在 `odom` 话题上被接收。

### GPS 输入

在名为 `fix` 的 `sensor_msgs/NavSatFix` 话题上发布的 GPS 可以改进全局 SLAM：

```lua
use_nav_sat = true
```

### 地标输入

对于在名为 `landmark` 的 `cartographer_ros_msgs/LandmarkList`（[在 cartographer_ros 中定义的消息](https://github.com/cartographer-project/cartographer_ros/blob/4b39ee68c7a4d518bf8d01a509331e2bc1f514a0/cartographer_ros_msgs/msg/LandmarkList.msg)）话题上发布的地标：

```lua
use_landmarks = true
```

## 纯定位模式

如果您已经有了满意的地图并希望减少计算量，可以使用 Cartographer 的纯定位模式，该模式将针对现有地图运行 SLAM，而不会构建新地图。

### 启用纯定位模式

通过使用 `-load_state_filename` 参数运行 `cartographer_node` 并在 lua 配置中定义以下行来启用：

```lua
TRAJECTORY_BUILDER.pure_localization_trimmer = {
    max_submaps_to_keep = 3,
}
```

## IMU 标定

在执行全局优化时，Ceres 会尝试改进 IMU 和测距传感器之间的位姿。

具有大量回环约束的精心选择的采集（例如，如果机器人沿直线行驶然后返回）可以提高这些校正的质量，并成为位姿校正的可靠来源。

然后，您可以将 Cartographer 用作校准过程的一部分，以提高机器人外参标定的质量。

## 多轨迹 SLAM

Cartographer 可以从多个并行发射数据的机器人执行 SLAM。

全局 SLAM 能够检测共享路径，并在可能的情况下立即合并不同机器人构建的地图。

这是通过使用两个 ROS 服务 `start_trajectory` 和 `finish_trajectory` 来实现的。（有关其用法的更多详细信息，请参阅 ROS API 参考文档）

### 应用场景

- 多机器人协同建图
- 分布式 SLAM
- 大规模环境建图

## 使用 gRPC 的云集成

Cartographer 围绕 Protobuf 消息构建，这使其非常灵活和可互操作。

该架构的优势之一是可以轻松分布在分散在互联网上的机器上。

### 典型用例

典型用例是在已知地图上导航的机器人群。它们可以在运行多轨迹 Cartographer 实例的远程强大集中式定位服务器上运行其 SLAM 算法。

### 优势

- **集中式计算**：利用强大的服务器进行 SLAM 计算
- **减少机器人负载**：机器人端只需发送传感器数据
- **统一地图管理**：所有机器人共享同一地图
- **实时协作**：多个机器人可以实时协作建图和定位

> [!NOTE]
> **TODO**：关于如何开始使用 gRPC Cartographer 实例的说明

## 参考资源

- [cartographer_ros_msgs 消息定义](https://github.com/cartographer-project/cartographer_ros/tree/master/cartographer_ros_msgs)
- [ROS API 参考文档](cartographer-ros-api-reference.md)
- [Cartographer 官方文档](https://google-cartographer.readthedocs.io/)
