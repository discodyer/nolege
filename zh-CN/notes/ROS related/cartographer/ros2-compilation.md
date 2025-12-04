---
tags:
  - ROS2
  - cartographer
  - ROS2-humble
comment: true
---

# ROS2 安装 Cartographer 教程

本教程将指导您在 ROS2 环境中安装和配置 Cartographer SLAM 系统。

## 方法一：使用二进制包安装（推荐）

这是最简单快捷的安装方法，适合大多数用户。

### 1. 更新系统

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. 安装 Cartographer

对于 ROS2 Humble：

```bash
sudo apt install ros-humble-cartographer ros-humble-cartographer-ros -y
```

### 3. 配置环境

将以下内容添加到您的 `~/.bashrc` 文件中：

```bash
source /opt/ros/humble/setup.bash
```

然后刷新环境：

```bash
source ~/.bashrc
```

### 4. 验证安装

检查 Cartographer 是否正确安装：

```bash
ros2 pkg list | grep cartographer
```

您应该看到类似以下输出：

```
cartographer_ros
cartographer_ros_msgs
```

## 方法二：从源码编译安装

如果您需要最新功能或需要自定义修改，可以选择从源码编译。

### 1. 安装依赖工具

```bash
sudo apt update
sudo apt install -y \
    python3-colcon-common-extensions \
    python3-rosdep \
    python3-vcstool \
    git \
    wget
```

### 2. 创建工作空间

```bash
mkdir -p ~/cartographer_ws/src
cd ~/cartographer_ws
```

### 3. 下载源码

#### 使用 vcs 工具（推荐）

创建一个 `cartographer.repos` 文件：

```bash
cat > cartographer.repos << 'EOF'
repositories:
  cartographer:
    type: git
    url: https://github.com/ros2/cartographer.git
    version: ros2
  cartographer_ros:
    type: git
    url: https://github.com/ros2/cartographer_ros.git
    version: ros2
EOF
```

然后导入仓库：

```bash
vcs import src < cartographer.repos
```

#### 手动克隆（备选方案）

```bash
cd ~/cartographer_ws/src
git clone -b ros2 https://github.com/ros2/cartographer.git
git clone -b ros2 https://github.com/ros2/cartographer_ros.git
```

### 4. 安装依赖

初始化 rosdep（如果之前没有初始化）：

```bash
sudo rosdep init
rosdep update
```

安装依赖包：

```bash
cd ~/cartographer_ws
rosdep install --from-paths src --ignore-src --rosdistro=${ROS_DISTRO} -y
```

### 5. 编译

```bash
cd ~/cartographer_ws
colcon build --symlink-install --cmake-args -DCMAKE_BUILD_TYPE=Release
```

> [!TIP]
> 如果编译过程中遇到内存不足的问题，可以限制并行编译任务数：
> ```bash
> colcon build --symlink-install --parallel-workers 1 --cmake-args -DCMAKE_BUILD_TYPE=Release
> ```

### 6. 配置环境

将工作空间添加到 `~/.bashrc`：

```bash
echo "source ~/cartographer_ws/install/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

或者仅在当前终端中加载：

```bash
source ~/cartographer_ws/install/setup.bash
```

## 安装验证和测试

### 1. 下载测试数据

下载示例 bag 文件：

```bash
mkdir -p ~/Downloads
cd ~/Downloads
wget https://storage.googleapis.com/cartographer-public-data/bags/backpack_2d/cartographer_paper_deutsches_museum.bag
```

### 2. 转换 ROS1 bag 到 ROS2（如需要）

如果您下载的是 ROS1 格式的 bag 文件，需要转换：

```bash
# 安装转换工具
sudo apt install ros-${ROS_DISTRO}-rosbag2-bag-v2-plugins

# 转换 bag 文件
ros2 bag convert --input cartographer_paper_deutsches_museum.bag --output-options output.yaml
```

### 3. 运行 Cartographer

创建一个简单的启动文件 `demo_2d.launch.py`：

```python
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument('use_sim_time', default_value='true'),
        
        Node(
            package='cartographer_ros',
            executable='cartographer_node',
            name='cartographer_node',
            output='screen',
            parameters=[{'use_sim_time': LaunchConfiguration('use_sim_time')}],
            arguments=[
                '-configuration_directory', '/opt/ros/${ROS_DISTRO}/share/cartographer_ros/configuration_files',
                '-configuration_basename', 'backpack_2d.lua'
            ]
        ),
        
        Node(
            package='cartographer_ros',
            executable='cartographer_occupancy_grid_node',
            name='cartographer_occupancy_grid_node',
            output='screen',
            parameters=[{'use_sim_time': LaunchConfiguration('use_sim_time')}]
        ),
    ])
```

## 下一步

安装完成后，您可以：

1. 阅读 [参数实战调优](parameter-details.md) - 基于实战经验的参数调优指南，包含传感器配置、前端/后端参数调整、常见问题解决方案。
2. 查看 [在演示包上运行 Cartographer ROS](ros-run-demo-bag.md) - 学习基本使用
3. 参考 [算法调优指南](ros-algo-walkthrough.md) - 深入讲解 Cartographer 的系统架构、局部/全局 SLAM 原理、扫描匹配和优化机制。
4. 参考 [调优方法论](ros-tuning-methodology.md) - 系统化的调优方法，通过实际案例讲解如何调优局部 SLAM、降低延迟、配置纯定位模式。

## 参考资料

- [Cartographer 官方文档](https://google-cartographer.readthedocs.io/)
- [Cartographer ROS 集成文档](https://google-cartographer-ros.readthedocs.io/)
- [ROS2 官方文档](https://docs.ros.org/)
- [Cartographer GitHub 仓库](https://github.com/cartographer-project/cartographer)
- [Cartographer ROS GitHub 仓库](https://github.com/cartographer-project/cartographer_ros)
