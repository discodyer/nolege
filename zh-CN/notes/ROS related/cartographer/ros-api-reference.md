---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - API参考
---

# Cartographer ROS API 参考文档

> [!NOTE]
> 本文档翻译自 [Cartographer ROS API 参考文档](https://google-cartographer-ros.readthedocs.io/en/latest/ros_api.html)
> 
> Apache License, Version 2.0

## Cartographer 节点 (Cartographer Node)

[cartographer_node](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/cartographer_ros/node_main.cc) 是用于在线实时 SLAM 的节点。

### 命令行标志

使用 `--help` 标志调用节点可查看所有可用选项。

### 订阅的话题 (Subscribed Topics)

以下测距数据话题是互斥的，至少需要一个测距数据源。

#### scan ([sensor_msgs/LaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/LaserScan.html))
在 2D 和 3D 中均支持（例如使用轴向旋转的平面激光扫描仪）。如果配置中 *num_laser_scans* 设置为 1，此话题将用作 SLAM 的输入。如果 *num_laser_scans* 大于 1，则将使用多个编号的扫描话题（即 scan_1、scan_2、scan_3...直到并包括 *num_laser_scans*）作为 SLAM 的输入。

#### echoes ([sensor_msgs/MultiEchoLaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/MultiEchoLaserScan.html))
在 2D 和 3D 中均支持（例如使用轴向旋转的平面激光扫描仪）。如果配置中 *num_multi_echo_laser_scans* 设置为 1，此话题将用作 SLAM 的输入。仅使用第一次回波。如果 *num_multi_echo_laser_scans* 大于 1，则将使用多个编号的回波话题（即 echoes_1、echoes_2、echoes_3...直到并包括 *num_multi_echo_laser_scans*）作为 SLAM 的输入。

#### points2 ([sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html))
如果配置中 *num_point_clouds* 设置为 1，此话题将用作 SLAM 的输入。如果 *num_point_clouds* 大于 1，则将使用多个编号的 points2 话题（即 points2_1、points2_2、points2_3...直到并包括 *num_point_clouds*）作为 SLAM 的输入。

以下额外的传感器数据话题也可以提供：

#### imu ([sensor_msgs/Imu](http://docs.ros.org/api/sensor_msgs/html/msg/Imu.html))
在 2D 中支持（可选），在 3D 中支持（必需）。此话题将用作 SLAM 的输入。

#### odom ([nav_msgs/Odometry](http://docs.ros.org/api/nav_msgs/html/msg/Odometry.html))
在 2D 中支持（可选），在 3D 中支持（可选）。如果配置中启用了 *use_odometry*，此话题将用作 SLAM 的输入。

### 发布的话题 (Published Topics)

#### scan_matched_points2 ([sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html))
用于扫描到子图匹配的点云。根据配置，此点云可能经过过滤和投影。

#### submap_list ([cartographer_ros_msgs/SubmapList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/SubmapList.msg))
所有轨迹中所有子图的列表，包括每个子图的位姿和最新版本号。

#### tracked_pose ([geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html))
仅在参数 `publish_tracked_pose` 设置为 `true` 时发布。跟踪坐标系相对于地图坐标系的位姿。

### 服务 (Services)

所有服务响应还包含一个 `StatusResponse`，包含 `code` 和 `message` 字段。
为了保持一致性，整数 `code` 等同于 [gRPC](https://developers.google.com/maps-booking/reference/grpc-api/status_codes) API 中使用的状态码。

#### submap_query ([cartographer_ros_msgs/SubmapQuery](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/SubmapQuery.srv))
获取请求的子图。

#### start_trajectory ([cartographer_ros_msgs/StartTrajectory](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/StartTrajectory.srv))
使用默认传感器话题和提供的配置启动轨迹。可以选择指定初始位姿。返回分配的轨迹 ID。

#### trajectory_query ([cartographer_ros_msgs/TrajectoryQuery](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/TrajectoryQuery.srv))
从位姿图返回轨迹数据。

#### finish_trajectory ([cartographer_ros_msgs/FinishTrajectory](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/FinishTrajectory.srv))
通过运行最终优化来完成给定 `trajectory_id` 的轨迹。

#### write_state ([cartographer_ros_msgs/WriteState](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/WriteState.srv))
将当前内部状态写入磁盘到 `filename`。文件通常会保存在 `~/.ros` 或 `ROS_HOME`（如果设置了）。此文件可用作 `assets_writer_main` 的输入，以生成概率栅格、X 射线或 PLY 文件等资源。

#### get_trajectory_states ([cartographer_ros_msgs/GetTrajectoryStates](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/GetTrajectoryStates.srv))
返回轨迹的 ID 和状态。例如，这可以用于从单独的节点观察 Cartographer 的状态。

#### read_metrics ([cartographer_ros_msgs/ReadMetrics](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/ReadMetrics.srv))
返回 Cartographer 所有内部指标的最新值。运行时指标的收集是可选的，必须使用节点中的 `--collect_metrics` 命令行标志激活。

### 所需的 TF 变换 (Required tf Transforms)

从所有传入传感器数据坐标系到配置的 *tracking_frame* 和 *published_frame* 的变换必须可用。通常，这些变换由 [robot_state_publisher](http://wiki.ros.org/robot_state_publisher) 或 [static_transform_publisher](http://wiki.ros.org/tf#static_transform_publisher) 周期性发布。

### 提供的 TF 变换 (Provided tf Transforms)

除非参数 `publish_to_tf` 设置为 `false`，否则将提供配置的 *map_frame* 和 *published_frame* 之间的变换。

如果配置中启用了 *provide_odom_frame*，还将提供配置的 *odom_frame* 和 *published_frame* 之间的连续（即不受回环影响）变换。

## 离线节点 (Offline Node)

[offline_node](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/cartographer_ros/offline_node_main.cc) 是对传感器数据包进行 SLAM 处理的最快方式。它不监听任何话题，而是从命令行提供的一组包中读取 TF 和传感器数据。它还会发布一个随传感器数据前进的时钟，即替代 `rosbag play`。在所有其他方面，它的行为类似于 `cartographer_node`。每个包将成为最终状态中的单独轨迹。完成处理所有数据后，它会写出最终的 Cartographer 状态并退出。

### 发布的话题 (Published Topics)

除了在线节点发布的话题外，此节点还发布：

#### ~bagfile_progress ([cartographer_ros_msgs/BagfileProgress](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/BagfileProgress.msg))
包文件处理进度，包括当前正在处理的包的详细信息，将以预定义的间隔发布，可以使用 `~bagfile_progress_pub_interval` ROS 参数指定。

### 参数 (Parameters)

#### ~bagfile_progress_pub_interval (double, 默认值=10.0)
发布包文件处理进度的间隔（单位：秒）。

## 占用栅格节点 (Occupancy Grid Node)

[occupancy_grid_node](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/cartographer_ros/occupancy_grid_node_main.cc) 监听 SLAM 发布的子图，从中构建 ROS 占用栅格并发布它。这个工具对于保持需要单一整体地图的旧节点工作很有用，直到新的导航栈可以直接处理 Cartographer 的子图。生成地图的开销很大且速度较慢，因此地图更新的时间间隔以秒为单位。您可以使用命令行选项选择性地包含/排除来自冻结（静态）或活动轨迹的子图。使用 `--help` 标志调用节点可查看这些选项。

### 订阅的话题 (Subscribed Topics)

它仅订阅 Cartographer 的 `submap_list` 话题。

### 发布的话题 (Published Topics)

#### map ([nav_msgs/OccupancyGrid](http://docs.ros.org/api/nav_msgs/html/msg/OccupancyGrid.html))
如果有订阅者，节点将持续计算并发布地图。更新之间的时间将随着地图大小的增加而增加。对于更快的更新，请使用子图 API。

## Pbstream 地图发布节点 (Pbstream Map Publisher Node)

[pbstream_map_publisher](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros/cartographer_ros/pbstream_map_publisher_main.cc) 是一个简单的节点，从序列化的 Cartographer 状态（pbstream 格式）创建静态占用栅格。如果不需要实时更新，这是占用栅格节点的高效替代方案。

### 订阅的话题 (Subscribed Topics)

无。

### 发布的话题 (Published Topics)

#### map ([nav_msgs/OccupancyGrid](http://docs.ros.org/api/nav_msgs/html/msg/OccupancyGrid.html))
发布的占用栅格话题是锁存的（latched）。

## 参考链接

- [robot_state_publisher](http://wiki.ros.org/robot_state_publisher)
- [static_transform_publisher](http://wiki.ros.org/tf#static_transform_publisher)
- [gRPC Status Codes](https://developers.google.com/maps-booking/reference/grpc-api/status_codes)

### 消息类型

- [sensor_msgs/Imu](http://docs.ros.org/api/sensor_msgs/html/msg/Imu.html)
- [sensor_msgs/LaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/LaserScan.html)
- [sensor_msgs/MultiEchoLaserScan](http://docs.ros.org/api/sensor_msgs/html/msg/MultiEchoLaserScan.html)
- [sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html)
- [nav_msgs/Odometry](http://docs.ros.org/api/nav_msgs/html/msg/Odometry.html)
- [nav_msgs/OccupancyGrid](http://docs.ros.org/api/nav_msgs/html/msg/OccupancyGrid.html)
- [geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html)

### Cartographer ROS 消息

- [cartographer_ros_msgs/SubmapList](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/SubmapList.msg)
- [cartographer_ros_msgs/BagfileProgress](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/msg/BagfileProgress.msg)

### Cartographer ROS 服务

- [cartographer_ros_msgs/FinishTrajectory](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/FinishTrajectory.srv)
- [cartographer_ros_msgs/SubmapQuery](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/SubmapQuery.srv)
- [cartographer_ros_msgs/StartTrajectory](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/StartTrajectory.srv)
- [cartographer_ros_msgs/TrajectoryQuery](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/TrajectoryQuery.srv)
- [cartographer_ros_msgs/WriteState](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/WriteState.srv)
- [cartographer_ros_msgs/GetTrajectoryStates](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/GetTrajectoryStates.srv)
- [cartographer_ros_msgs/ReadMetrics](https://github.com/cartographer-project/cartographer_ros/blob/master/cartographer_ros_msgs/srv/ReadMetrics.srv)
