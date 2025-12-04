---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 索引页
comment: true
---

# Cartographer 中文文档库

欢迎来到 Cartographer 中文文档库！本文档库提供了完整的 Cartographer SLAM 算法学习资料，包含官方文档翻译和实战调优指南。

本文档库包含系统化的 Cartographer 文档，涵盖从入门到精通的全部内容。由于网上的资料非常零散，并且良莠不齐，所以就有了现在这个文档库。所有参考的文章链接都会放在文档最后。

## 📖 完整文档列表

### 入门篇

- **[ROS2 安装 Cartographer 教程 ](ros2-compilation.md)** - 包含了从 APT 源和从源码编译的教程
- **[参数实战调优](parameter-details.md)** - 基于实战经验的参数调优指南，包含传感器配置、前端/后端参数调整、常见问题解决方案。

---

### Cartographer ROS 集成官方文档中文翻译

Cartographer ROS 集成官方文档[🔗链接](https://google-cartographer-ros.readthedocs.io/en/latest/index.html)

[Cartographer](https://github.com/cartographer-project/cartographer) 是一个可在多个平台和传感器配置下提供 2D 和 3D 实时同步定位与建图 ([SLAM](https://en.wikipedia.org/wiki/Simultaneous_localization_and_mapping)) 的系统。

![](images/demo_2d.gif)

*   **[编译 Cartographer ROS](ros-compilation.md)**
    *   [系统要求](ros-compilation.md#sys-requirements)
    *   [构建与安装](ros-compilation.md#build-install)

*   **[在演示包上运行 Cartographer ROS](ros-run-demo-bag.md)**
    *   [德意志博物馆](ros-run-demo-bag.md#deutsches-museum)
    *   [纯定位](ros-run-demo-bag.md#pure-localization)
    *   [静态地标](ros-run-demo-bag.md#static-landmarks)
    *   [Revo LDS](ros-run-demo-bag.md#revo-lds)
    *   [PR2](ros-run-demo-bag.md#pr2)
    *   [Taurob Tracker](ros-run-demo-bag.md#taurob-tracker)

*   **[在您自己的 bag 上运行 Cartographer ROS](ros-run-your-bag.md)**
    *   [验证您的 bag 包](ros-run-your-bag.md#verify-bag)
    *   [创建 .lua 配置文件](ros-run-your-bag.md#create-lua)
    *   [为您的 SLAM 场景创建 .launch 文件](ros-run-your-bag.md#create-launch)
    *   [测试您的配置](ros-run-your-bag.md#test-config)

*   **[算法调优指南](ros-algo-walkthrough.md)** - 深入讲解 Cartographer 的系统架构、局部/全局 SLAM 原理、扫描匹配和优化机制。
    *   [系统概述](ros-algo-walkthrough.md#system-overview)
    *   [输入数据处理](ros-algo-walkthrough.md#input-processing)
    *   [局部 SLAM](ros-algo-walkthrough.md#local-slam)
    *   [全局 SLAM](ros-algo-walkthrough.md#global-slam)

*   **[调优方法论](ros-tuning-methodology.md)** - 系统化的调优方法，通过实际案例讲解如何调优局部 SLAM、降低延迟、配置纯定位模式。
    *   [内置工具](ros-tuning-methodology.md#builtin-tools)
    *   [示例：调优局部 SLAM](ros-tuning-methodology.md#tune-local-slam)
    *   [特殊情况](ros-tuning-methodology.md#edge-cases)
    *   [仍然有问题？](ros-tuning-methodology.md#still-issues)

*   **[利用 Cartographer ROS 生成的地图](ros-assets-writer.md)** - 学习如何使用 Assets Writer 导出高分辨率地图，配置点云处理管道，进行点云可视化。
    *   [使用示例](ros-assets-writer.md#usage-example)
    *   [配置](ros-assets-writer.md#configuration)
    *   [点云的第一人称可视化](ros-assets-writer.md#pointcloud-viz)

*   **[高级功能](ros-advanced-features.md)** - 介绍多传感器输入（里程计、GPS、地标）、纯定位模式、IMU 标定、多轨迹 SLAM、gRPC 云集成等。
    *   [更多输入源](ros-advanced-features.md#multi-sensors)
    *   [纯定位模式](ros-advanced-features.md#localization-mode)
    *   [IMU 标定](ros-advanced-features.md#imu-calibration)
    *   [多轨迹 SLAM](ros-advanced-features.md#multi-trajectory)
    *   [使用 gRPC 的云集成](ros-advanced-features.md#grpc-integration)

*   [参与贡献](https://google-cartographer-ros.readthedocs.io/en/latest/getting_involved.html)

*   **[Lua 配置参考文档](ros-lua-config-reference.md)** - ROS 集成的顶层配置选项，包括坐标系、传感器话题、TF 变换等配置。

*   **[ROS API 参考文档](ros-api-reference.md)** - 详细说明 Cartographer Node、Offline Node、Occupancy Grid Node 的使用方法。
    *   [Cartographer 节点](ros-api-reference.md#cartographer-node)
    *   [离线节点](ros-api-reference.md#offline-node)
    *   [占用栅格节点](ros-api-reference.md#occupancy-grid-node)
    *   [Pbstream 地图发布节点](ros-api-reference.md#pbstream-publisher)

*   [公开数据集](https://google-cartographer-ros.readthedocs.io/en/latest/data.html)
    *   [2D Cartographer Backpack – Deutsches Museum](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#d-cartographer-backpack-deutsches-museum)
    *   [3D Cartographer Backpack – Deutsches Museum](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#d-cartographer-backpack-deutsches-museum-1)
    *   [MiR](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#mir)
    *   [PR2 – Willow Garage](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#pr2-willow-garage)
    *   [Magazino](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#magazino)

*   **[常见问题](ros-faq.md)**
    *   [为什么 3D 数据包中的激光雷达数据频率高于 VLP-16 官方标称的最高 20Hz 转速？](ros-faq.md#vlp16-hz-issue)
    *   [为什么 3D SLAM 需要 IMU 数据而 2D 不需要？](ros-faq.md#imu-requirement)
    *   [如何在不支持 rviz 的情况下构建 cartographer_ros？](ros-faq.md#no-rviz-build)
    *   [如何修复 "You called InitGoogleLogging() twice!" 错误？](ros-faq.md#googlelogging-error)

---

### Cartographer 官方文档中文翻译

Cartographer 官方文档[🔗链接](https://google-cartographer.readthedocs.io/)

- **[官方配置参数参考](config-reference.md)** - 完整的 Cartographer 核心算法参数列表，包括 2D/3D SLAM 所有配置选项。

### Cartographer 相关论文翻译

- [Real-Time Loop Closure in 2D LIDAR SLAM](hess2016.md) - 2D 激光雷达 SLAM 中的实时回环检测

## 🔗 相关资源

### 官方资源
- [Cartographer 官方文档](https://google-cartographer.readthedocs.io/)
- [Cartographer ROS 集成官方文档](https://google-cartographer-ros.readthedocs.io/en/latest/index.html)
- [Cartographer GitHub](https://github.com/cartographer-project/cartographer)
- [Cartographer ROS GitHub](https://github.com/cartographer-project/cartographer_ros)
- [Cartographer GitHub | ROS2](https://github.com/ros2/cartographer)
- [Cartographer ROS GitHub | ROS2](https://github.com/ros2/cartographer_ros)

### 社区资源
- [Cartographer Issues](https://github.com/cartographer-project/cartographer/issues)
- [Cartographer ROS Issues](https://github.com/cartographer-project/cartographer_ros/issues)

## 💬 反馈与贡献

如果您在使用文档过程中有任何问题或建议，欢迎通过 [GitHub Issues](https://github.com/discodyer/nolege/issues) 或者直接在下方评论区反馈。
