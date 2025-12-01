---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - FAQ
---

# Cartographer 常见问题解答 (FAQ)

> [!NOTE]
> 本文档翻译自 [Cartographer ROS - Frequently asked questions](https://google-cartographer-ros.readthedocs.io/en/latest/faq.html)
> 
> Apache License, Version 2.0

## 为什么 3D 数据包中的激光雷达数据频率高于 VLP-16 官方标称的最高 20Hz 转速？

VLP-16 在示例数据包中配置为以 20 Hz 旋转。然而，VLP-16 发送 UDP 数据包的频率要高得多，并且与旋转频率无关。示例数据包包含每个 UDP 数据包对应一个 [sensor_msgs/PointCloud2](http://www.ros.org/doc/api/sensor_msgs/html/msg/PointCloud2.html)，而不是每转一圈对应一个。

在[相应的 Cartographer 配置文件](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/configuration_files/backpack_3d.lua)中，您会看到 `TRAJECTORY_BUILDER_3D.num_accumulated_range_data = 160`，这意味着我们将 160 个每个 UDP 数据包的点云累积成一个更大的点云，通过结合恒定速度和 IMU 测量来合并运动估计以进行匹配。由于有两个 VLP-16，160 个 UDP 数据包大约足够旋转 2 圈，每个 VLP-16 一圈。

## 为什么 3D SLAM 需要 IMU 数据而 2D 不需要？

在 2D 中，Cartographer 支持运行相关扫描匹配器，该匹配器通常用于查找闭环约束，也可用于局部 SLAM。虽然计算成本较高，但通常可以使里程计或 IMU 数据的整合变得不必要。2D 还有假设平面世界的好处，即"向上"方向是隐式定义的。

在 3D 中，IMU 主要用于测量重力。重力是一个很有价值的测量量，因为它不会漂移，是一个非常强的信号，通常包含任何测量加速度的大部分。

重力的需求主要有两个原因：

1. **世界对齐**
   在 3D 中对世界没有任何假设。为了正确地将生成的轨迹和地图与世界对齐，重力用于定义 z 方向。

2. **简化扫描匹配**
   一旦确定了重力方向，横滚（roll）和俯仰（pitch）就可以从 IMU 读数中很好地推导出来。这通过减少这些维度的搜索窗口来节省扫描匹配器的工作量。

## 如何在不支持 rviz 的情况下构建 cartographer_ros？

最简单的解决方案是在 `cartographer_rviz` 包目录中创建一个名为 [`CATKIN_IGNORE`](http://wiki.ros.org/catkin/workspaces) 的空文件。

## 如何修复 "You called InitGoogleLogging() twice!" 错误？

使用 `glog` 后端构建 `rosconsole` 可能会导致此错误。使用 `log4cxx` 或 `print` 后端可以避免此问题，可通过 `ROSCONSOLE_BACKEND` CMake 参数进行选择。

## 参考链接

- [sensor_msgs/PointCloud2](http://www.ros.org/doc/api/sensor_msgs/html/msg/PointCloud2.html)
- [Catkin Workspaces](http://wiki.ros.org/catkin/workspaces)
- [Cartographer 3D 配置文件示例](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/configuration_files/backpack_3d.lua)
