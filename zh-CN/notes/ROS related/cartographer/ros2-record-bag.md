---
tags:
  - ROS2-humble
  - ROS
comment: true
---

# ROS2 下录制和回放 Bag 包教程

## 概述

本教程将指导你如何在 ROS2 环境中录制 bag 包，这些数据将用于调试 Cartographer SLAM 算法。

## 前提条件

- 已安装 ROS2
- 拥有适当的传感器 (如激光雷达、IMU、里程计等)

### 安装必要工具

首先安装 rosbag2 和相关工具：

```bash
sudo apt install ros-${ROS_DISTRO}-rosbag2 ros-${ROS_DISTRO}-rviz2
```

### 确定要录制的主题

Cartographer 通常需要以下类型的数据：

1. **激光扫描数据** (例如 `/scan`)
2. **IMU 数据** (例如 `/imu`)
3. **里程计数据** (可选，例如 `/odom`)
4. **TF 变换** (通常自动录制)

使用以下命令查看可用的主题：

```bash
ros2 topic list
```

## 录制 bag 包

### 录制 bag 包的基本命令

使用以下命令录制指定主题：

```bash
ros2 bag record -o <bag_name> <topic1> <topic2> <topic3> ...
```

例如，录制激光和 IMU 数据：

```bash
ros2 bag record -o cartographer_$(date +%y-%m-%d-%H-%M-%S) /scan /imu
```

### 优化录制设置

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

## 常见问题

### 时间戳问题

有时回放数据不正常，很多时候是时间戳的问题, bag 文件的时间并非本机时间，在默认情况下，ROS 使用 ubuntu 系统的时间，也就是 wall clock time。但 bag 文件中记录的是历史时间，所以 play 之前要告诉 ROS 启用 simulated time

启动节点的时候设置参数 `use_sim_time:=true`

```bash
ros2 launch example_package example.launch.py use_sim_time:=true
```

回放的时候加上 `--clock`

```bash
ros2 bag play --clock cartographer_debug
```

### 断网后录制被中断

有些时候小车会开出WiFi的信号范围，这时候录制的bag会被中断，我们可以设置 `ROS_LOCALHOST_ONLY` 环境变量来将ROS2通信限制在本地主机，这样你的ROS2系统及其话题、服务和操作都将对本地网络上的其他计算机不可见。在有多个机器人的场景下也非常有用，可以避免多个机器人向同一个话题发布消息，从而导致异常行为。你可以使用以下命令设置此环境变量。

```bash
export ROS_LOCALHOST_ONLY=1
```

或者将其写入`.bashrc`

```bash
echo "export ROS_LOCALHOST_ONLY=1" >> ~/.bashrc
```

## 参考资料

- [Recording and playing back data](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Recording-And-Playing-Back-Data/Recording-And-Playing-Back-Data.html)
- [Configuring environment](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Configuring-ROS2-Environment.html)
