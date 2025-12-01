---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
  - 地图导出
---

# 利用 Cartographer ROS 生成的地图

> [!NOTE]
> 本文档翻译自 [Cartographer ROS Assets Writer 官方文档](https://google-cartographer-ros.readthedocs.io/en/latest/assets_writer.html)
> 
> Apache License, Version 2.0
> 
> Cartographer SHA: 30f7de1a325d6604c780f2f74d9a345ec369d12d
> 
> Cartographer ROS SHA: 44459e18102305745c56f92549b87d8e91f434fe

## 概述

随着传感器数据的输入，SLAM 算法（如 Cartographer）的状态会不断演化，以保持机器人轨迹和周围环境的*当前最佳估计*。因此，Cartographer 能够提供的最准确的定位和建图是在算法完成时获得的。

Cartographer 可以将其内部状态序列化为 `.pbstream` 文件格式，这本质上是一个压缩的 protobuf 文件，包含 Cartographer 内部使用的数据结构的快照。

为了在实时中高效运行，Cartographer 会立即丢弃其大部分传感器数据，仅使用其输入的一小部分，内部使用的地图（并保存在 `.pbstream` 文件中）因此非常粗糙。然而，当算法完成并建立了最佳轨迹后，可以*事后*将其与完整的传感器数据重新组合以创建高分辨率地图。

Cartographer 使用 `cartographer_assets_writer` 实现这种重组。

## Assets Writer 输入

Assets Writer 需要以下输入：

1. **原始传感器数据**：用于执行 SLAM 的传感器数据（ROS `.bag` 文件）
2. **Cartographer 状态**：执行 SLAM 时捕获的 cartographer 状态（保存在 `.pbstream` 文件中）
3. **传感器外参**：来自 bag 的 TF 数据或 URDF 描述
4. **管道配置**：在 `.lua` 文件中定义

Assets Writer 使用 `.pbstream` 中找到的轨迹批量处理 `.bag` 数据。管道可用于对 SLAM 点云数据进行着色、过滤并导出为各种格式。有多个这样的点处理步骤可以在管道中交错使用 - [cartographer/io](https://github.com/cartographer-project/cartographer/tree/f1ac8967297965b8eb6f2f4b08a538e052b5a75b/cartographer/io) 中已经提供了几个。

## 使用示例

### 离线节点自动保存

使用离线节点运行 Cartographer 时，会自动保存 `.pbstream` 文件。例如，使用 3D 录制包示例：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_3d/b3-2016-04-05-14-14-00.bag
roslaunch cartographer_ros offline_backpack_3d.launch bag_filenames:=${HOME}/Downloads/b3-2016-04-05-14-14-00.bag
```

观察命令行输出，直到节点终止。它将写入 `b3-2016-04-05-14-14-00.bag.pbstream`，表示 Cartographer 处理完所有数据并完成所有优化后的状态。

### 在线节点手动保存

在线节点运行时，Cartographer 不知道您的 bag（或传感器输入）何时结束，因此您需要使用公开的服务来明确完成当前轨迹并让 Cartographer 序列化其当前状态：

```bash
# 完成第一个轨迹。不再接受该轨迹的数据。
rosservice call /finish_trajectory 0

# 要求 Cartographer 序列化其当前状态。
# （按 Tab 键快速展开参数语法）
rosservice call /write_state "{filename: '${HOME}/Downloads/b3-2016-04-05-14-14-00.bag.pbstream', include_unfinished_submaps: "true"}"
```

### 运行 Assets Writer

获得 `.pbstream` 文件后，可以使用 3D 背包的[示例管道](https://github.com/cartographer-project/cartographer_ros/blob/44459e18102305745c56f92549b87d8e91f434fe/cartographer_ros/configuration_files/assets_writer_backpack_3d.lua)运行 assets writer：

```bash
roslaunch cartographer_ros assets_writer_backpack_3d.launch \
   bag_filenames:=${HOME}/Downloads/b3-2016-04-05-14-14-00.bag \
   pose_graph_filename:=${HOME}/Downloads/b3-2016-04-05-14-14-00.bag.pbstream
```

所有输出文件都以 `--output_file_prefix` 为前缀，默认为第一个 bag 的文件名。对于上一个示例，如果您在管道配置文件中指定 `points.ply`，这将转换为 `${HOME}/Downloads/b3-2016-04-05-14-14-00.bag_points.ply`。

## 配置

Assets Writer 被建模为 [PointsProcessor](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/points_processor.h) 步骤的管道。[PointsBatch](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/points_batch.h) 数据流经每个处理器，它们都有机会在传递之前修改 `PointsBatch`。

例如，[assets_writer_backpack_3d.lua](https://github.com/cartographer-project/cartographer_ros/blob/44459e18102305745c56f92549b87d8e91f434fe/cartographer_ros/configuration_files/assets_writer_backpack_3d.lua) 管道使用 `min_max_range_filter` 删除距离传感器太近或太远的点。之后，它保存"*X 射线*"（地图的半透明侧视图），然后根据传感器 frame ID 重新着色 `PointsBatch`，并使用这些新颜色写入另一组 X 射线。

## 可用的 PointsProcessor

可用的 `PointsProcessor` 都在 [cartographer/io](https://github.com/cartographer-project/cartographer/tree/f1ac8967297965b8eb6f2f4b08a538e052b5a75b/cartographer/io) 子目录中定义，并在各自的头文件中进行了记录。

### color_points
根据 frame_id 为点着色固定颜色。

### dump_num_points
传递点，但跟踪它看到了多少点，并在 Flush 时输出。

### fixed_ratio_sampler
只让固定的 `sampling_ratio` 的点通过。`sampling_ratio` 为 1.0 时，此过滤器无操作。

### frame_id_filter
过滤所有具有黑名单 frame_id 或非白名单 frame_id 的点。注意，您可以指定白名单或黑名单，但不能同时指定两者。

### write_hybrid_grid
创建点的混合栅格，体素大小为 `voxel_size`。`range_data_inserter` 选项用于配置通过混合栅格的距离数据光线追踪。

### intensity_to_color
对来自具有 `frame_id` 的传感器的每个点应用 `(intensity - min) / (max - min) * 255`，并用此值为点着灰色。如果 `frame_id` 为空，这适用于所有点。

### min_max_range_filtering
过滤所有距离其 `origin` 比 `max_range` 更远或比 `min_range` 更近的点。

### voxel_filter_and_remove_moving_objects
对数据进行体素过滤，仅传递我们认为在非移动对象上的点。

### write_pcd
将 PCD 文件流式传输到磁盘。标头在 `Flush` 中写入。

### write_ply
将 PLY 文件流式传输到磁盘。标头在 `Flush` 中写入。

### write_probability_grid
创建具有指定 `resolution` 的概率栅格。由于所有点都投影到 x-y 平面，因此忽略数据的 z 分量。`range_data_inserter` 选项用于配置通过概率栅格的距离数据光线追踪。

### write_xray_image
通过点创建 X 射线切片，像素大小为 `voxel_size`。

### write_xyz
写入 ASCII xyz 点。

## 点云的第一人称可视化

两个 `PointsProcessor` 特别有趣：`pcd_writing` 和 `ply_writing` 可以将点云保存为 `.pcd` 或 `.ply` 文件格式。然后，这些文件格式可以由专用软件（如 [point_cloud_viewer](https://github.com/cartographer-project/point_cloud_viewer) 或 [meshlab](http://www.meshlab.net/)）使用，以浏览高分辨率地图。

### 典型管道配置

这种结果的典型 assets writer 管道由以下部分组成：

1. [IntensityToColorPointsProcessor](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/intensity_to_color_points_processor.cc) - 为点着非白色
2. [PlyWritingPointsProcessor](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/ply_writing_points_processor.h) - 将结果导出到 `.ply` 点云

此类管道的示例在 [assets_writer_backpack_2d.lua](https://github.com/cartographer-project/cartographer_ros/blob/44459e18102305745c56f92549b87d8e91f434fe/cartographer_ros/configuration_files/assets_writer_backpack_2d.lua) 中。

### 使用 point_cloud_viewer

获得 `.ply` 后，按照 [point_cloud_viewer](https://github.com/cartographer-project/point_cloud_viewer) 的 README 生成磁盘上的八叉树数据结构，可以通过同一仓库中的查看器之一（SDL 或基于 Web）查看。

**注意**：`point_cloud_viewer` 需要颜色才能正常工作。

## 参考资源

- [cartographer/io 目录](https://github.com/cartographer-project/cartographer/tree/f1ac8967297965b8eb6f2f4b08a538e052b5a75b/cartographer/io)
- [PointsProcessor](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/points_processor.h)
- [PointsBatch](https://github.com/cartographer-project/cartographer/blob/30f7de1a325d6604c780f2f74d9a345ec369d12d/cartographer/io/points_batch.h)
- [point_cloud_viewer](https://github.com/cartographer-project/point_cloud_viewer)
- [meshlab](http://www.meshlab.net/)
- [示例配置文件](https://github.com/cartographer-project/cartographer_ros/tree/master/cartographer_ros/configuration_files)
