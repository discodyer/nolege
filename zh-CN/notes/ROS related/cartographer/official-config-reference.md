---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 官方文档
---

# Cartographer 官方配置参数参考

> 本文档翻译自 [Cartographer 官方配置文档](https://google-cartographer.readthedocs.io/en/latest/configuration.html)
> 
> 原文档根据 .proto 文件自动生成
> 
> Apache License, Version 2.0

## cartographer.common.proto.CeresSolverOptions
Ceres 求解器选项

### bool use_nonmonotonic_steps
配置 Ceres 求解器。更多信息请参阅 Ceres 文档：https://code.google.com/p/ceres-solver/

### int32 max_num_iterations
最大迭代次数

### int32 num_threads
线程数


## cartographer.mapping.pose_graph.proto.ConstraintBuilderOptions
约束构建器选项

### double sampling_ratio
如果已添加约束与潜在约束的比例低于此数值，则会添加一个约束。

### double max_constraint_distance
位姿被认为靠近子图的阈值距离。

### double min_score
扫描匹配分数的阈值，低于此值的匹配不被考虑。
低分数表示扫描和地图看起来不相似。

### double global_localization_min_score
全局定位可信度阈值，低于此值的全局定位不被信任。

### double loop_closure_translation_weight
优化问题中用于闭环约束平移分量的权重。

### double loop_closure_rotation_weight
优化问题中用于闭环约束旋转分量的权重。

### bool log_matches
如果启用，会记录闭环约束的信息用于调试。

### cartographer.mapping_2d.scan_matching.proto.FastCorrelativeScanMatcherOptions fast_correlative_scan_matcher_options
内部使用的扫描匹配器选项。

### cartographer.mapping_2d.scan_matching.proto.CeresScanMatcherOptions ceres_scan_matcher_options
Ceres 扫描匹配器选项（2D）

### cartographer.mapping_3d.scan_matching.proto.FastCorrelativeScanMatcherOptions fast_correlative_scan_matcher_options_3d
快速相关扫描匹配器选项（3D）

### cartographer.mapping_3d.scan_matching.proto.CeresScanMatcherOptions ceres_scan_matcher_options_3d
Ceres 扫描匹配器选项（3D）


## cartographer.mapping.pose_graph.proto.OptimizationProblemOptions
优化问题选项

### double huber_scale
Huber 损失函数的缩放参数。

### double acceleration_weight
IMU 加速度项的缩放参数。

### double rotation_weight
IMU 旋转项的缩放参数。

### double local_slam_pose_translation_weight
基于局部 SLAM 位姿的连续节点之间平移的缩放参数。

### double local_slam_pose_rotation_weight
基于局部 SLAM 位姿的连续节点之间旋转的缩放参数。

### double odometry_translation_weight
基于里程计的连续节点之间平移的缩放参数。

### double odometry_rotation_weight
基于里程计的连续节点之间旋转的缩放参数。

### double fixed_frame_pose_translation_weight
固定坐标系位姿平移的缩放参数。

### double fixed_frame_pose_rotation_weight
固定坐标系位姿旋转的缩放参数。

### bool log_solver_summary
如果为 true，将为每次优化记录 Ceres 求解器摘要。

### cartographer.common.proto.CeresSolverOptions ceres_solver_options
Ceres 求解器选项


## cartographer.mapping.proto.MapBuilderOptions
地图构建器选项

### bool use_trajectory_builder_2d
是否使用 2D 轨迹构建器

### bool use_trajectory_builder_3d
是否使用 3D 轨迹构建器

### int32 num_background_threads
用于后台计算的线程数。

### cartographer.mapping.proto.PoseGraphOptions pose_graph_options
位姿图选项


## cartographer.mapping.proto.MotionFilterOptions
运动过滤器选项

### double max_time_seconds
基于时间插入距离数据的阈值（超过此时间则插入）。

### double max_distance_meters
基于线性运动插入距离数据的阈值（超过此距离则插入）。

### double max_angle_radians
基于旋转运动插入距离数据的阈值（超过此角度则插入）。


## cartographer.mapping.proto.PoseGraphOptions
位姿图选项

### int32 optimize_every_n_nodes
在线闭环：如果为正值，将在构建地图时运行闭环检测。

### cartographer.mapping.pose_graph.proto.ConstraintBuilderOptions constraint_builder_options
约束构建器选项。

### double matcher_translation_weight
优化问题中用于非闭环扫描匹配约束平移分量的权重。

### double matcher_rotation_weight
优化问题中用于非闭环扫描匹配约束旋转分量的权重。

### cartographer.mapping.pose_graph.proto.OptimizationProblemOptions optimization_problem_options
优化问题选项。

### int32 max_num_final_iterations
最终优化时在 'optimization_problem_options' 中使用的迭代次数。

### double global_sampling_ratio
用于全局定位的单条轨迹节点采样率。

### bool log_residual_histograms
是否输出位姿残差的直方图。

### double global_constraint_search_after_n_seconds
如果在此选项指定的持续时间内，两条轨迹之间没有添加全局约束，
则闭环搜索将在全局范围内执行，而不是在较小的搜索窗口内。


## cartographer.mapping.proto.TrajectoryBuilderOptions
轨迹构建器选项

### cartographer.mapping_2d.proto.LocalTrajectoryBuilderOptions trajectory_builder_2d_options
2D 局部轨迹构建器选项

### cartographer.mapping_3d.proto.LocalTrajectoryBuilderOptions trajectory_builder_3d_options
3D 局部轨迹构建器选项

### bool pure_localization
纯定位模式（不建图）


## cartographer.mapping_2d.proto.LocalTrajectoryBuilderOptions
2D 局部轨迹构建器选项

### float min_range
测距仪点云超出这些范围的点将被丢弃（最小范围）。

### float max_range
测距仪点云超出这些范围的点将被丢弃（最大范围）。

### float min_z
Z 轴最小值

### float max_z
Z 轴最大值

### float missing_data_ray_length
超过 'max_range' 的点将以此长度作为空白空间插入。

### int32 num_accumulated_range_data
累积到一个未变形的组合距离数据中的距离数据帧数，用于扫描匹配。

### float voxel_filter_size
裁剪后立即应用于距离数据的体素滤波器大小。

### cartographer.sensor.proto.AdaptiveVoxelFilterOptions adaptive_voxel_filter_options
用于计算稀疏点云以进行匹配的体素滤波器。

### cartographer.sensor.proto.AdaptiveVoxelFilterOptions loop_closure_adaptive_voxel_filter_options
用于计算稀疏点云以查找闭环的体素滤波器。

### bool use_online_correlative_scan_matching
是否首先使用相关扫描匹配器求解在线扫描匹配，为 Ceres 生成一个良好的起点。

### cartographer.mapping_2d.scan_matching.proto.RealTimeCorrelativeScanMatcherOptions real_time_correlative_scan_matcher_options
实时相关扫描匹配器选项

### cartographer.mapping_2d.scan_matching.proto.CeresScanMatcherOptions ceres_scan_matcher_options
Ceres 扫描匹配器选项

### cartographer.mapping.proto.MotionFilterOptions motion_filter_options
运动过滤器选项

### double imu_gravity_time_constant
通过 IMU 观察重力的方向移动平均的时间常数（单位：秒）。
应选择该值以平衡以下误差：
1. 非重力加速度测量的误差（当常数减小时变差）
2. 角速度积分的误差（当常数增大时变差）

### cartographer.mapping_2d.proto.SubmapsOptions submaps_options
子图选项

### bool use_imu_data
如果需要并使用 IMU 数据，则为 true。


## cartographer.mapping_2d.proto.RangeDataInserterOptions
距离数据插入器选项（2D）

### double hit_probability
命中的概率变化（将转换为几率，因此必须大于 0.5）。

### double miss_probability
未命中的概率变化（将转换为几率，因此必须小于 0.5）。

### bool insert_free_space
如果为 'false'，自由空间将不会改变占用栅格中的概率。


## cartographer.mapping_2d.proto.SubmapsOptions
子图选项（2D）

### double resolution
地图分辨率（单位：米）。

### int32 num_range_data
添加新子图之前的距离数据帧数。
每个子图将插入两倍数量的距离数据：
首先用于初始化而不进行匹配，然后在进行匹配时。

### cartographer.mapping_2d.proto.RangeDataInserterOptions range_data_inserter_options
距离数据插入器选项


## cartographer.mapping_2d.scan_matching.proto.CeresScanMatcherOptions
Ceres 扫描匹配器选项（2D）

### double occupied_space_weight
每个代价函数的缩放参数（占用空间权重）。

### double translation_weight
平移权重

### double rotation_weight
旋转权重

### cartographer.common.proto.CeresSolverOptions ceres_solver_options
配置 Ceres 求解器。更多信息请参阅 Ceres 文档：
https://code.google.com/p/ceres-solver/


## cartographer.mapping_2d.scan_matching.proto.FastCorrelativeScanMatcherOptions
快速相关扫描匹配器选项（2D）

### double linear_search_window
将找到最佳可能扫描对齐的最小线性搜索窗口。

### double angular_search_window
将找到最佳可能扫描对齐的最小角度搜索窗口。

### int32 branch_and_bound_depth
要使用的预计算网格数量（分支定界深度）。


## cartographer.mapping_2d.scan_matching.proto.RealTimeCorrelativeScanMatcherOptions
实时相关扫描匹配器选项（2D）

### double linear_search_window
将找到最佳可能扫描对齐的最小线性搜索窗口。

### double angular_search_window
将找到最佳可能扫描对齐的最小角度搜索窗口。

### double translation_delta_cost_weight
应用于分数各部分的权重（平移增量代价权重）。

### double rotation_delta_cost_weight
旋转增量代价权重


## cartographer.mapping_3d.proto.LocalTrajectoryBuilderOptions
3D 局部轨迹构建器选项

### float min_range
测距仪点云超出这些范围的点将被丢弃（最小范围）。

### float max_range
测距仪点云超出这些范围的点将被丢弃（最大范围）。

### int32 num_accumulated_range_data
累积到一个未变形的组合距离数据中的距离数据帧数，用于扫描匹配。

### float voxel_filter_size
裁剪后立即应用于距离数据的体素滤波器大小。

### cartographer.sensor.proto.AdaptiveVoxelFilterOptions high_resolution_adaptive_voxel_filter_options
用于计算稀疏点云以进行匹配的体素滤波器（高分辨率）。

### cartographer.sensor.proto.AdaptiveVoxelFilterOptions low_resolution_adaptive_voxel_filter_options
低分辨率自适应体素滤波器选项

### bool use_online_correlative_scan_matching
是否首先使用相关扫描匹配器求解在线扫描匹配，为 Ceres 生成一个良好的起点。

### cartographer.mapping_2d.scan_matching.proto.RealTimeCorrelativeScanMatcherOptions real_time_correlative_scan_matcher_options
实时相关扫描匹配器选项

### cartographer.mapping_3d.scan_matching.proto.CeresScanMatcherOptions ceres_scan_matcher_options
Ceres 扫描匹配器选项（3D）

### cartographer.mapping.proto.MotionFilterOptions motion_filter_options
运动过滤器选项

### double imu_gravity_time_constant
通过 IMU 观察重力的方向移动平均的时间常数（单位：秒）。
应选择该值以平衡以下误差：
1. 非重力加速度测量的误差（当常数减小时变差）
2. 角速度积分的误差（当常数增大时变差）

### int32 rotational_histogram_size
旋转扫描匹配器的直方图桶数。

### cartographer.mapping_3d.proto.SubmapsOptions submaps_options
子图选项（3D）


## cartographer.mapping_3d.proto.RangeDataInserterOptions
距离数据插入器选项（3D）

### double hit_probability
命中的概率变化（将转换为几率，因此必须大于 0.5）。

### double miss_probability
未命中的概率变化（将转换为几率，因此必须小于 0.5）。

### int32 num_free_space_voxels
用于扫描匹配的自由空间体素更新数量上限。
0 表示禁用自由空间。


## cartographer.mapping_3d.proto.SubmapsOptions
子图选项（3D）

### double high_resolution
用于局部 SLAM 和闭环的 'high_resolution' 地图分辨率（单位：米）。

### double high_resolution_max_range
插入 'high_resolution' 地图之前过滤点云的最大范围。

### double low_resolution
仅用于局部 SLAM 的 'low_resolution' 版本地图的分辨率（单位：米）。

### int32 num_range_data
添加新子图之前的距离数据帧数。
每个子图将插入两倍数量的距离数据：
首先用于初始化而不进行匹配，然后在进行匹配时。

### cartographer.mapping_3d.proto.RangeDataInserterOptions range_data_inserter_options
距离数据插入器选项（3D）


## cartographer.mapping_3d.scan_matching.proto.CeresScanMatcherOptions
Ceres 扫描匹配器选项（3D）

### double occupied_space_weight
每个代价函数的缩放参数（占用空间权重）。

### double translation_weight
平移权重

### double rotation_weight
旋转权重

### bool only_optimize_yaw
是否仅允许改变偏航角，保持横滚/俯仰恒定。

### cartographer.common.proto.CeresSolverOptions ceres_solver_options
配置 Ceres 求解器。更多信息请参阅 Ceres 文档：
https://code.google.com/p/ceres-solver/


## cartographer.mapping_3d.scan_matching.proto.FastCorrelativeScanMatcherOptions
快速相关扫描匹配器选项（3D）

### int32 branch_and_bound_depth
要使用的预计算网格数量（分支定界深度）。

### int32 full_resolution_depth
要使用的全分辨率网格数量，额外的网格将每次减半分辨率。

### double min_rotational_score
旋转扫描匹配器的最小分数。

### double min_low_resolution_score
低分辨率网格的分数阈值，低于此值的匹配不被考虑。
仅用于 3D。

### double linear_xy_search_window
在垂直于重力的平面内将找到最佳可能扫描对齐的线性搜索窗口。

### double linear_z_search_window
在重力方向上将找到最佳可能扫描对齐的线性搜索窗口。

### double angular_search_window
将找到最佳可能扫描对齐的最小角度搜索窗口。


## cartographer.sensor.proto.AdaptiveVoxelFilterOptions
自适应体素滤波器选项

### float max_length
体素边的 'max_length'（最大长度）。

### float min_num_points
如果有更多点且至少保留 'min_num_points' 个点，
则会减小体素长度以尝试获得这个最小点数。

### float max_range
距离原点更远的点将被移除。
