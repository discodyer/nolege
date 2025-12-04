---
tags:
  - ROS2-humble
  - ROS
comment: true
---

# ROS2 下录制和回放 Bag 包教程

## 概述

本教程将指导你如何在 ROS2 环境中录制 bag 包，这些数据将用于调试 Cartographer SLAM 算法。我们将涵盖必要的传感器数据、录制技巧以及优化建议。

## 前提条件

- 已安装 ROS2
- 拥有适当的传感器 (如激光雷达、IMU、里程计等)

## 安装必要工具

首先安装 rosbag2 和相关工具：

```bash
sudo apt install ros-${ROS_DISTRO}-rosbag2 ros-${ROS_DISTRO}-rviz2
```

## 确定要录制的主题

Cartographer 通常需要以下类型的数据：

1. **激光扫描数据** (例如 `/scan`)
2. **IMU 数据** (例如 `/imu`)
3. **里程计数据** (可选，例如 `/odom`)
4. **TF 变换** (通常自动录制)

使用以下命令查看可用的主题：

```bash
ros2 topic list
```

## 录制 bag 包的基本命令

使用以下命令录制指定主题：

```bash
ros2 bag record -o <bag_name> <topic1> <topic2> <topic3> ...
```

例如，录制激光和 IMU 数据：

```bash
ros2 bag record -o cartographer_$(date +%y-%m-%d-%H-%M-%S) /scan /imu
```

## 优化录制设置

1. **使用压缩**：减少 bag 文件大小
   ```bash
   ros2 bag record -o cartographer_$(date +%y-%m-%d-%H-%M-%S) --compression-mode message --compression-format zstd /scan /imu
   ```

2. **分割大文件**：
   ```bash
   ros2 bag record -o cartographer_$(date +%y-%m-%d-%H-%M-%S) --max-bag-size 1024 /scan /imu
   ```

3. **设置录制持续时间**（秒）：
   ```bash
   ros2 bag record -o cartographer_$(date +%y-%m-%d-%H-%M-%S) --duration 60 /scan /imu
   ```

## 回放 bag 包

```bash
ros2 bag play cartographer_debug
```

## 参考资料

- [Recording and playing back data](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Recording-And-Playing-Back-Data/Recording-And-Playing-Back-Data.html)
