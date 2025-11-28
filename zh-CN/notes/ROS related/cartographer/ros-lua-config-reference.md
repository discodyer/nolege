---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - Lua配置
---

# Cartographer ROS Lua 配置参考文档

> 本文档翻译自 [Cartographer ROS 集成的 Lua 配置参考文档](https://google-cartographer-ros.readthedocs.io/en/latest/configuration.html)
> 
> Apache License, Version 2.0

## 重要说明

### 关于坐标系命名

Cartographer 的 ROS 集成使用 [tf2](http://wiki.ros.org/tf2)，因此所有坐标系 ID 应仅包含坐标系名称（小写字母加下划线），不包含前缀或斜杠。常用坐标系请参阅 [REP 105](http://www.ros.org/reps/rep-0105.html)。

### 关于话题命名

在Cartographer的ROS集成中，话题名称作为**基础名称**（参见 [ROS Names](http://wiki.ros.org/Names)）给出。这意味着用户需要自行重映射或将其放入命名空间。

## Cartographer ROS 集成顶层配置选项

以下是 Cartographer ROS 集成的顶层配置选项，所有选项都必须在 Lua 配置文件中指定：

### map_frame
- 用于发布子图的 ROS 坐标系 ID，通常是位姿的父坐标系，通常设为 `"map"`。

### tracking_frame
- SLAM 算法跟踪的坐标系的 ROS 坐标系 ID。如果使用 IMU，它应该位于 IMU 的位置（可旋转）。常用值为 `"imu_link"`。

### published_frame
- 用作发布位姿的子坐标系的 ROS 坐标系 ID。例如，如果系统的其他部分提供了 `"odom"` 坐标系，则可以使用 `"odom"`。在这种情况下，`"odom"` 在 *map_frame* 中的位姿将被发布。否则，将其设置为 `"base_link"` 可能是合适的。

### odom_frame
- 仅在 *provide_odom_frame* 为 true 时使用。用于发布（非闭环）局部 SLAM 结果的坐标系，位于 *published_frame* 和 *map_frame* 之间。通常是 `"odom"`。

### provide_odom_frame
- 如果启用，局部的、非闭环的、连续的位姿将作为 *map_frame* 中的 *odom_frame* 发布。

### publish_frame_projected_to_2d
- 如果启用，发布的位姿将被限制为纯 2D 位姿（无横滚、俯仰或 z 偏移）。这可以防止在 2D 模式下由于位姿外推步骤而可能出现的不需要的平面外位姿（例如，如果位姿应作为类似 'base-footprint' 的坐标系发布）。

### use_odometry
- 如果启用，将订阅话题 `"odom"` 上的 [nav_msgs/Odometry](http://docs.ros.org/api/nav_msgs/html/msg/Odometry.html) 消息。在这种情况下必须提供里程计数据，并且该信息将包含在 SLAM 中。

### use_nav_sat
- 如果启用，将订阅话题 `"fix"` 上的 [sensor_msgs/NavSatFix](http://docs.ros.org/api/sensor_msgs/html/msg/NavSatFix.html) 消息。在这种情况下必须提供导航数据，并且该信息将包含在全局 SLAM 中。

### use_landmarks
- 如果启用，将订阅话题 `"landmarks"` 上的 [cartographer_ros_msgs/LandmarkList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/LandmarkList.msg) 消息。必须提供地标数据，作为 [cartographer_ros_msgs/LandmarkList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/LandmarkList.msg) 中的 [cartographer_ros_msgs/LandmarkEntry](https://github.com/cartographer-project/cartographer_ros/blob/4b39ee68c7a4d518bf8d01a509331e2bc1f514a0/cartographer_ros_msgs/msg/LandmarkEntry.msg)。如果提供了 [cartographer_ros_msgs/LandmarkEntry](https://github.com/cartographer-project/cartographer_ros/blob/4b39ee68c7a4d518bf8d01a509331e2bc1f514a0/cartographer_ros_msgs/msg/LandmarkEntry.msg) 数据，该信息将根据 [cartographer_ros_msgs/LandmarkEntry](https://github.com/cartographer-project/cartographer_ros/blob/4b39ee68c7a4d518bf8d01a509331e2bc1f514a0/cartographer_ros_msgs/msg/LandmarkEntry.msg) 的 ID 包含在 SLAM 中。[cartographer_ros_msgs/LandmarkList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/LandmarkList.msg) 应以与其他传感器相当的采样率提供。列表可以为空，但必须提供，因为 Cartographer 严格按时间顺序排序传感器数据以使地标具有确定性。但是，可以将轨迹构建器选项 `"collate_landmarks"` 设置为 false，以允许非确定性但也非阻塞的方法。

### num_laser_scans
- 要订阅的激光扫描话题数量。对于一个激光扫描仪，订阅话题 `"scan"` 上的 [sensor_msgs/LaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/LaserScan.html)；对于多个激光扫描仪，订阅话题 `"scan_1"`、`"scan_2"` 等。

### num_multi_echo_laser_scans
- 要订阅的多回波激光扫描话题数量。对于一个激光扫描仪，订阅话题 `"echoes"` 上的 [sensor_msgs/MultiEchoLaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/MultiEchoLaserScan.html)；对于多个激光扫描仪，订阅话题 `"echoes_1"`、`"echoes_2"` 等。

### num_subdivisions_per_laser_scan
- 将每个接收到的（多回波）激光扫描分割成的点云数量。细分扫描使得可以对扫描仪移动时获取的扫描进行去畸变。有一个相应的轨迹构建器选项，用于将细分的扫描累积到将用于扫描匹配的点云中。

### num_point_clouds
- 要订阅的点云话题数量。对于一个测距仪，订阅话题 `"points2"` 上的 [sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html)；对于多个测距仪，订阅话题 `"points2_1"`、`"points2_2"` 等。

### lookup_transform_timeout_sec
- 使用 [tf2](http://wiki.ros.org/tf2) 查找变换时使用的超时时间（单位：秒）。

### submap_publish_period_sec
- 发布子图位姿的时间间隔（单位：秒），例如 0.3 秒。

### pose_publish_period_sec
- 发布位姿的时间间隔（单位：秒），例如 5e-3 表示频率为 200 Hz。

### publish_to_tf
- 启用或禁用提供 TF 变换。

### publish_tracked_pose
- 启用将跟踪的位姿作为 [geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html) 发布到话题 `"tracked_pose"`。

### trajectory_publish_period_sec
- 发布轨迹标记的时间间隔（单位：秒），例如 30e-3 表示 30 毫秒。

### rangefinder_sampling_ratio
- 测距仪消息的固定比率采样。

### odometry_sampling_ratio
- 里程计消息的固定比率采样。

### fixed_frame_sampling_ratio
- 固定坐标系消息的固定比率采样。

### imu_sampling_ratio
- IMU 消息的固定比率采样。

### landmarks_sampling_ratio
- 地标消息的固定比率采样。

## 参考链接

- [REP 105](http://www.ros.org/reps/rep-0105.html) - 机器人坐标系约定
- [ROS Names](http://wiki.ros.org/Names) - ROS 命名约定
- [geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html)
- [nav_msgs/OccupancyGrid](http://docs.ros.org/api/nav_msgs/html/msg/OccupancyGrid.html)
- [nav_msgs/Odometry](http://docs.ros.org/api/nav_msgs/html/msg/Odometry.html)
- [sensor_msgs/LaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/LaserScan.html)
- [sensor_msgs/MultiEchoLaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/MultiEchoLaserScan.html)
- [sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html)
- [sensor_msgs/NavSatFix](http://docs.ros.org/api/sensor_msgs/html/msg/NavSatFix.html)
- [cartographer_ros_msgs/LandmarkList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/LandmarkList.msg)
- [cartographer_ros_msgs/LandmarkEntry](https://github.com/cartographer-project/cartographer_ros/blob/4b39ee68c7a4d518bf8d01a509331e2bc1f514a0/cartographer_ros_msgs/msg/LandmarkEntry.msg)
- [tf2](http://wiki.ros.org/tf2) - ROS 变换库
