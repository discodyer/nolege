---
tags:
  - ROS2-humble
  - ROS
  - cartographer
  - SLAM
  - 索引页
---

# Cartographer 中文文档库

欢迎来到 Cartographer 中文文档库！本文档库提供了完整的 Cartographer SLAM 算法学习资料，包含官方文档翻译和实战调优指南。

## 📚 文档概览

本文档库包含系统化的 Cartographer 文档，涵盖从入门到精通的全部内容。

## 📖 完整文档列表

### 入门篇

- **[参数实战调优](parameter-details.md)** - 基于实战经验的参数调优指南，包含传感器配置、前端/后端参数调整、常见问题解决方案。

---

### Cartographer ROS 集成官方文档中文翻译

*   [编译 Cartographer ROS](https://google-cartographer-ros.readthedocs.io/en/latest/compilation.html)
    *   [系统要求](https://google-cartographer-ros.readthedocs.io/en/latest/compilation.html#system-requirements)
    *   [构建与安装](https://google-cartographer-ros.readthedocs.io/en/latest/compilation.html#building-installation)

*   [在演示包上运行 Cartographer ROS](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html)
    *   [Deutsches Museum](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#deutsches-museum-1)
    *   [纯定位](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#pure-localization)
    *   [静态地标](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#static-landmarks)
    *   [Revo LDS](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#revo-lds)
    *   [PR2](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#pr2)
    *   [Taurob Tracker](https://google-cartographer-ros.readthedocs.io/en/latest/demos.html#taurob-tracker)

*   [在你自己的 bag 包上运行 Cartographer ROS](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html)
    *   [验证你的 bag 包](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html#validate-your-bag)
    *   [创建 .lua 配置文件](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html#create-a-lua-configuration)
    *   [为你的 SLAM 场景创建 .launch 文件](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html#create-launch-files-for-your-slam-scenarios)
    *   [测试你的配置](https://google-cartographer-ros.readthedocs.io/en/latest/your_bag.html#try-your-configuration)

*   **[算法调优指南](algorithm-tuning-guide.md)** - 深入讲解 Cartographer 的系统架构、局部/全局 SLAM 原理、扫描匹配和优化机制。
    *   [系统概述](algorithm-tuning-guide.md#系统概述)
    *   [输入数据处理](algorithm-tuning-guide.md#输入数据处理)
    *   [局部 SLAM](algorithm-tuning-guide.md#局部-slam)
    *   [全局 SLAM](algorithm-tuning-guide.md#全局-slam)

*   **[调优方法论](tuning-methodology.md)** - 系统化的调优方法，通过实际案例讲解如何调优局部 SLAM、降低延迟、配置纯定位模式。
    *   [内置工具](tuning-methodology.md#内置工具)
    *   [示例：调优局部 SLAM](tuning-methodology.md#示例调优局部-slam)
    *   [特殊情况](tuning-methodology.md#特殊情况)
    *   [仍然有问题？](tuning-methodology.md#仍然有问题)

*   **[利用 Cartographer ROS 生成的地图](assets-writer.md)** - 学习如何使用 Assets Writer 导出高分辨率地图，配置点云处理管道，进行点云可视化。
    *   [使用示例](assets-writer.md#使用示例)
    *   [配置](assets-writer.md#配置)
    *   [点云的第一人称可视化](assets-writer.md#点云的第一人称可视化)

*   **[高级功能](advanced-features.md)** - 介绍多传感器输入（里程计、GPS、地标）、纯定位模式、IMU 标定、多轨迹 SLAM、gRPC 云集成等。
    *   [更多输入源](advanced-features.md#更多输入源)
    *   [纯定位模式](advanced-features.md#纯定位模式)
    *   [IMU 标定](advanced-features.md#imu-标定)
    *   [多轨迹 SLAM](advanced-features.md#多轨迹-slam)
    *   [使用 gRPC 的云集成](advanced-features.md#使用-grpc-的云集成)

*   [参与贡献](https://google-cartographer-ros.readthedocs.io/en/latest/getting_involved.html)

*   **[Lua 配置参考文档](ros-lua-config-reference.md)** - ROS 集成的顶层配置选项，包括坐标系、传感器话题、TF 变换等配置。

*   **[ROS API 参考文档](ros-api-reference.md)** - 详细说明 Cartographer Node、Offline Node、Occupancy Grid Node 的使用方法。
    *   [Cartographer 节点](ros-api-reference.md#cartographer-节点-cartographer-node)
    *   [离线节点](ros-api-reference.md#离线节点-offline-node)
    *   [占用栅格节点](ros-api-reference.md#占用栅格节点-occupancy-grid-node)
    *   [Pbstream 地图发布节点](ros-api-reference.md#pbstream-地图发布节点-pbstream-map-publisher-node)

*   [公开数据集](https://google-cartographer-ros.readthedocs.io/en/latest/data.html)
    *   [2D Cartographer Backpack – Deutsches Museum](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#d-cartographer-backpack-deutsches-museum)
    *   [3D Cartographer Backpack – Deutsches Museum](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#d-cartographer-backpack-deutsches-museum-1)
    *   [MiR](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#mir)
    *   [PR2 – Willow Garage](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#pr2-willow-garage)
    *   [Magazino](https://google-cartographer-ros.readthedocs.io/en/latest/data.html#magazino)

*   **[常见问题](faq.md)**
    *   [为什么 3D 数据包中的激光雷达数据频率高于 VLP-16 官方标称的最高 20Hz 转速？](faq.md#为什么-3d-数据包中的激光雷达数据频率高于-vlp-16-官方标称的最高-20hz-转速)
    *   [为什么 3D SLAM 需要 IMU 数据而 2D 不需要？](faq.md#为什么-3d-slam-需要-imu-数据而-2d-不需要)
    *   [如何在不支持 rviz 的情况下构建 cartographer_ros？](faq.md#如何在不支持-rviz-的情况下构建-cartographer_ros)
    *   [如何修复 "You called InitGoogleLogging() twice!" 错误？](faq.md#如何修复-you-called-initgooglelogging-twice-错误)

---

### Cartographer 官方文档中文翻译

- **[官方配置参数参考](official-config-reference.md)** - 完整的 Cartographer 核心算法参数列表，包括 2D/3D SLAM 所有配置选项。

## 🔗 相关资源

### 官方资源
- [Cartographer 官方文档](https://google-cartographer.readthedocs.io/)
- [Cartographer ROS 集成官方文档](https://google-cartographer-ros.readthedocs.io/en/latest/index.html)
- [Cartographer GitHub](https://github.com/cartographer-project/cartographer)
- [Cartographer ROS GitHub](https://github.com/cartographer-project/cartographer_ros)

### 社区资源
- [Cartographer Issues](https://github.com/cartographer-project/cartographer/issues)
- [Cartographer ROS Issues](https://github.com/cartographer-project/cartographer_ros/issues)

## 💬 反馈与贡献

如果您在使用文档过程中有任何问题或建议，欢迎通过 GitHub Issues 反馈。
