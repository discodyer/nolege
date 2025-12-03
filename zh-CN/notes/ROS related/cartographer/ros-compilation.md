---
tags:
  - ROS2-humble
  - ROS
  - cartographer
comment: true
---

# 编译 Cartographer ROS

## 系统要求 {#sys-requirements}

Cartographer ROS 的系统要求与 [Cartographer 的要求](https://google-cartographer.readthedocs.io/en/latest/#system-requirements)相同。

目前支持以下 [ROS 发行版](http://wiki.ros.org/Distributions)：

* Melodic
* Noetic

## 构建与安装 {#build-install}

为了构建 Cartographer ROS，我们推荐使用 [wstool](http://wiki.ros.org/wstool) 和 [rosdep](http://wiki.ros.org/rosdep)。为了加快构建速度，我们还推荐使用 [Ninja](https://ninja-build.org)。

在 Ubuntu Focal 系统上使用 ROS Noetic 时，使用以下命令安装上述工具：

```bash
sudo apt-get update
sudo apt-get install -y python3-wstool python3-rosdep ninja-build stow
```

在较旧的发行版上：

```bash
sudo apt-get update
sudo apt-get install -y python-wstool python-rosdep ninja-build stow
```

工具安装完成后,在 `catkin_ws` 中创建一个新的 cartographer_ros 工作空间。

```bash
mkdir catkin_ws
cd catkin_ws
wstool init src
wstool merge -t src https://raw.githubusercontent.com/cartographer-project/cartographer_ros/master/cartographer_ros.rosinstall
wstool update -t src
```

现在需要安装 cartographer_ros 的依赖项。
首先，我们使用 `rosdep` 来安装所需的软件包。
如果您在安装 ROS 后已经执行过 `sudo rosdep init` 命令，该命令会打印一个错误。这个错误可以忽略。

```bash
sudo rosdep init
rosdep update
rosdep install --from-paths src --ignore-src --rosdistro=${ROS_DISTRO} -y
```

Cartographer 使用 [abseil-cpp](https://abseil.io/) 库，需要使用以下脚本手动安装：

```bash
src/cartographer/scripts/install_abseil.sh
```

由于版本冲突，您可能需要使用以下命令卸载 ROS 的 abseil-cpp：

```bash
sudo apt-get remove ros-${ROS_DISTRO}-abseil-cpp
```

构建和安装。

```bash
catkin_make_isolated --install --use-ninja
```

这将从 master 分支的最新 HEAD 构建 Cartographer。
如果您想要特定版本，需要在 `cartographer_ros.rosinstall` 中更改版本。
