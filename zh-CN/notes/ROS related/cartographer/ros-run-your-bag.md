---
tags:
  - ROS
  - cartographer
comment: true
---

# 在您自己的 bag 上运行 Cartographer ROS

> [!NOTE]
> 本文档翻译自 [Cartographer ROS - Running Cartographer ROS on your own bag](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html)
> 
> Apache License, Version 2.0

现在您已经在几个提供的 bag 文件上运行了 Cartographer ROS，可以继续让 Cartographer 使用您自己的数据了。
找到一个您想用于 SLAM 的 `.bag` 记录文件，然后按照本教程进行操作。

> [!WARNING]
> 当您想要运行 cartographer_ros 时，可能需要先通过运行 `source install_isolated/setup.bash` 来配置 ROS 环境（如果您的 shell 是 zsh，请将 bash 替换为 zsh）

## 验证您的 bag {#verify-bag}

Cartographer ROS 提供了一个名为 `cartographer_rosbag_validate` 的工具，用于自动分析 bag 中存在的数据。
在尝试为不正确的数据调整 Cartographer 之前运行此工具通常是个好主意。

它借鉴了 Cartographer 作者的经验，可以检测 bag 中常见的各种错误。
例如，如果检测到 `sensor_msgs/Imu` 主题，该工具将确保重力矢量没有从 IMU 测量中移除，因为 Cartographer 使用重力范数来确定地面的方向。

该工具还可以就如何提高数据质量提供建议。
例如，对于 Velodyne LIDAR，建议传感器发送的每个 UDP 数据包对应一个 `sensor_msgs/PointCloud2` 消息，而不是每转一圈对应一个消息。
有了这种粒度，Cartographer 就能够解除由机器人运动引起的点云变形，从而获得更好的重建效果。

如果您已配置 Cartographer ROS 环境，只需像这样运行该工具：

```bash
cartographer_rosbag_validate -bag_filename your_bag.bag
```

## 创建 .lua 配置文件 {#create-lua}

Cartographer 非常灵活，可以配置为在各种机器人上工作。
机器人配置从 `options` 数据结构中读取，该结构必须通过 Lua 脚本定义。
示例配置定义在 `src/cartographer_ros/cartographer_ros/configuration_files` 中，并安装在 `install_isolated/share/cartographer_ros/configuration_files/` 中。

> [!NOTE]
> 理想情况下，.lua 配置应该是特定于机器人的，而不是特定于 bag 的。

您可以从复制其中一个示例开始，然后根据自己的需要进行调整。如果您想使用 3D SLAM：

```bash
cp install_isolated/share/cartographer_ros/configuration_files/backpack_3d.lua install_isolated/share/cartographer_ros/configuration_files/my_robot.lua
```

如果您想使用 2D SLAM：

```bash
cp install_isolated/share/cartographer_ros/configuration_files/backpack_2d.lua install_isolated/share/cartographer_ros/configuration_files/my_robot.lua
```

然后您可以编辑 `my_robot.lua` 以满足机器人的需求。
`options` 块中定义的值定义了 Cartographer ROS 前端应如何与您的 bag 交互。
`options` 段落之后定义的值用于调整 Cartographer 的内部工作，我们暂时忽略这些。

> [!TIP]
> 参见 [Cartographer ROS 配置值参考文档](ros-lua-config-reference.md)和 [Cartographer 配置值参考文档](config-reference.md)。

在您需要调整的值中，您可能需要在 `map_frame`、`tracking_frame`、`published_frame` 和 `odom_frame` 中提供环境和机器人的 TF 坐标系 ID。

> [!NOTE]
> 您可以从 bag 中的 `/tf` 主题分发机器人的 TF 树，或在 `.urdf` 机器人定义中定义它。

> [!WARNING]
> 您应该信任您的位姿！机器人与 IMU 或 LIDAR 之间链接的微小偏移可能导致地图重建不一致。Cartographer 通常可以纠正小的位姿误差，但不能纠正所有误差！

您需要定义的其他值与您要使用的传感器的数量和类型有关。

- `num_laser_scans`：您将使用的 `sensor_msgs/LaserScan` 主题的数量。
- `num_multi_echo_laser_scans`：您将使用的 `sensor_msgs/MultiEchoLaserScan` 主题的数量。
- `num_point_clouds`：您将使用的 `sensor_msgs/PointCloud2` 主题的数量。

您还可以使用 `use_landmarks` 和 `use_nav_sat` 启用地标和 GPS 作为额外的定位源。`options` 块中的其余变量通常应保持不变。

> [!NOTE]
> 即使您使用 2D SLAM，地标也是 3D 对象，如果仅在 2D 平面上查看，由于其第三维度，可能会误导您。

但是，有一个全局变量您绝对需要根据 bag 的需求进行调整：`TRAJECTORY_BUILDER_3D.num_accumulated_range_data` 或 `TRAJECTORY_BUILDER_2D.num_accumulated_range_data`。
此变量定义构建完整扫描（通常是完整旋转一圈）所需的消息数量。
如果您遵循 `cartographer_rosbag_validate` 的建议，每次扫描使用 100 条 ROS 消息，则可以将此变量设置为 100。
如果您有两个测距传感器（例如两个 LIDAR）同时提供完整扫描，则应将此变量设置为 2。

## 为您的 SLAM 场景创建 .launch 文件 {#create-launch}

您可能已经注意到，上一节介绍的每个演示都是使用不同的 roslaunch 命令运行的。
Cartographer 的推荐用法确实是为每个机器人和 SLAM 类型提供自定义 `.launch` 文件。
示例 `.launch` 文件定义在 `src/cartographer_ros/cartographer_ros/launch` 中，并安装在 `install_isolated/share/cartographer_ros/launch/` 中。

首先复制提供的示例之一：

```bash
cp install_isolated/share/cartographer_ros/launch/backpack_3d.launch install_isolated/share/cartographer_ros/launch/my_robot.launch
cp install_isolated/share/cartographer_ros/launch/demo_backpack_3d.launch install_isolated/share/cartographer_ros/launch/demo_my_robot.launch
cp install_isolated/share/cartographer_ros/launch/offline_backpack_3d.launch install_isolated/share/cartographer_ros/launch/offline_my_robot.launch
cp install_isolated/share/cartographer_ros/launch/demo_backpack_3d_localization.launch install_isolated/share/cartographer_ros/launch/demo_my_robot_localization.launch
cp install_isolated/share/cartographer_ros/launch/assets_writer_backpack_3d.launch install_isolated/share/cartographer_ros/launch/assets_writer_my_robot.launch
```

- `my_robot.launch` 用于在机器人上使用真实传感器数据在线（实时）执行 SLAM。
- `demo_my_robot.launch` 用于从开发机器使用，需要 `bag_filename` 参数来重放记录的数据。此启动文件还会生成一个配置为可视化 Cartographer 状态的 rviz 窗口。
- `offline_my_robot.launch` 与 `demo_my_robot.launch` 非常相似，但尝试尽可能快地执行 SLAM。这可以显著加快地图构建速度。此启动文件还可以使用提供给 `bag_filenames` 参数的多个 bag 文件。
- `demo_my_robot_localization.launch` 与 `demo_my_robot.launch` 非常相似，但需要 `load_state_filename` 参数，指向先前 Cartographer 执行的 `.pbstream` 记录。先前的记录将用作预先计算的地图，Cartographer 将仅在此地图上执行定位。
- `assets_writer_my_robot.launch` 用于从先前 Cartographer 执行的 `.pbstream` 记录中提取数据。

同样，需要对这些文件进行一些调整以适合您的机器人。

- 提供给 `-configuration_basename` 的每个参数都应调整为指向 `my_robot.lua`。
- 如果您决定使用机器人的 `.urdf` 描述，应将描述放在 `install_isolated/share/cartographer_ros/urdf` 中，并调整 `robot_description` 参数以指向您的文件名。
- 如果您决定使用 `/tf` 消息，可以删除 `robot_description` 参数、`robot_state_publisher` 节点以及以 `-urdf` 开头的行。
- 如果您的 bag 或传感器发布的主题名称与 Cartographer ROS 期望的名称不匹配，您可以使用 `<remap>` 元素重定向您的主题。期望的主题名称取决于您使用的测距设备类型。

> [!NOTE]
> - IMU 主题预期命名为 `imu`
> - 如果您只使用一个 `sensor_msgs/LaserScan` 主题，预期命名为 `scan`。如果有多个，应命名为 `scan_1`、`scan_2` 等...
> - 如果您只使用一个 `sensor_msgs/MultiEchoLaserScan` 主题，预期命名为 `echoes`。如果有多个，应命名为 `echoes_1`、`echoes_2` 等...
> - 如果您只使用一个 `sensor_msgs/PointCloud2` 主题，预期命名为 `points2`。如果有多个，应命名为 `points2_1`、`points2_2` 等...

## 测试您的配置 {#test-config}

一切都设置好了！现在您可以使用以下命令启动 Cartographer：

```bash
roslaunch cartographer_ros my_robot.launch bag_filename:=/path/to/your_bag.bag
```

如果您足够幸运，一切都应该按预期工作。
但是，您可能会遇到一些需要调整的问题。
