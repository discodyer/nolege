---
tags:
  - openEuler
  - ROS2-humble
---
# ROS基础编程测试题目

## [test 01](https://github.com/discodyer/shutsuryoku/tree/test01)

<!-- ## test 02

 - 新建功能包，编写第一个ROS节点实现TF发布功能：发布/world_link到/base_link的静态TF（可自定义）以及/base_link到/camera_link的动态TF（可自定义）
 - 编写第二个ROS节点实现TF监听功能：监听/camera_link到/base_link的动态TF并在终端打印输出
 - 启动rviz查看TF的实时变化

## test 03

 - 新建功能包，设计一个名为 PerformMathOperation 的服务接口，该接口用于执行基本的数学运算，包括加法、减法、乘法和除法。服务的请求为两个数num和需要操作的类型（加法、减法、乘法和除法，服务的返回为计算结果
 - 分别编写服务端节点和客户端节点实现上面的功能
 - 客户端允许在启动时以参数的形式输入两个num的值和需要操作的类型， 当接收到服务返回的结果后，将结果以话题的形式发布出来

## test 04

 - 新建功能包，自定义action通信接口让小乌龟走一条直线并反馈执行过程和结果。action的goal为start_move，feedback为小乌龟的odom信息（可以设置一定的更新频率），goal为小乌龟是否完成目标（走完自定义的一段路程）
 - 编写action的服务端和客户端程序

## test 05

 - 安装usb_cam或其他USB摄像头驱动包驱动笔记本电脑自带的摄像头
 - 新建功能包，编写节点实时订阅摄像头发布的图像话题消息并将ROS图像消息转换为OpenCV图像
 - 在图像右上角绘制矩形，再将OpenCV图像转换回ROS图像消息重新发布到一个新的话题
 - 用rviz或者rqt_image_view显示图像消息 -->

代码放在本仓库的各个分支中

## 操作步骤

首先安装ros环境，按照这边的教程 [在 openEuler 24.03 上安装 ROS2 Humble](/src/2-oe-ros2-test/2-1-install-ros2-on-oe2403.md)

确保你有 `colcon` 工具包，可以使用pip3安装

```bash
pip3 install -U pytest colcon-common-extensions
```

### 创建工作区

```bash
mkdir -p ~/ros2_ws/src/plct-test
cd ~/ros2_ws/src/plct-test
# 创建一个包，名称为 test01 ，采用MIT协议开源
ros2 pkg create test01 --license MIT
```

然后会在 `src/plct-test` 下创建一个名为 `test01` 的包

可以把 `plct-test` 目录创建为git仓库，管理你的项目

首先，[在 GitHub 上创建一个存储库](https://docs.github.com/zh/repositories/creating-and-managing-repositories/creating-a-new-repository)

```bash
# cd ~/ros2_ws/src/plct-test
echo "# test01" >> README.md
git init
# 创建并切换到一个名为test01的分支
git checkout -q -b test01
git add .
git commit -m "first commit"
# 修改为你的仓库地址
git remote add origin https://github.com/your_account/your_repo.git
git push --set-upstream origin test01
```

上面的命令会初始化Git仓库，创建一个`test01`分支并推送到远程仓库

可以先用`colcon build`初始化一下工作区

```bash
cd ~/ros2_ws
colcon build
```

然后会在顶层目录创建三个文件夹

```text
.
├── build
├── install
├── log
└── src
```

此时，执行 `source ~/ros2_ws/install/setup.bash` 设置环境，或者添加到`.bashrc`中

```bash
echo "source ~/ros2_ws/install/setup.bash" >> ~/.bashrc
```

## ROS2 相关概念

### TurtleSim 坐标系

在 `turtlesim` 中，坐标系定义如下：

- **世界坐标系**：`turtlesim` 的世界坐标系是一个二维平面，原点位于左下角 `(0, 0)`，坐标范围从 `(0, 0)` 到 `(11.08, 11.08)`

 - **X 轴**：沿着水平向右增加
 - **Y 轴**：沿着垂直向上增加

每只乌龟的姿态包括位置 `(x, y)` 和朝向 `theta`，`theta` 是一个表示乌龟相对于 X 轴的角度（以弧度为单位）

### 小乌龟的控制方式

在 `turtlesim` 中，控制乌龟的主要方式包括：

- **速度控制**：通过发布 `geometry_msgs::msg::Twist` 消息到 `/turtle1/cmd_vel` 话题，控制乌龟的线速度和角速度

 - `linear.x` 控制乌龟的前进或后退速度
 - `angular.z` 控制乌龟的旋转速度

- **服务调用**：ROS 2 提供服务调用来执行特定操作，如生成新乌龟、传送乌龟到指定位置等

 - `/spawn` 服务：生成新的乌龟，并设置其初始位置和朝向
 - `/teleport_absolute` 服务：将乌龟传送到指定的绝对位置
 - `/teleport_relative` 服务：相对于乌龟的当前位置进行传送

### 获取小乌龟的位置信息

虽然 `turtlesim` 不提供传统的里程计（odom）话题，但可以通过订阅 `/turtle1/pose` 话题获取乌龟的当前位置和朝向信息，达到类似里程计的效果。`/turtle1/pose` 发布的是 `turtlesim::msg::Pose` 消息，包含以下字段：

 - `x` 和 `y`：乌龟的当前位置
 - `theta`：乌龟的朝向角度
 - `linear_velocity` 和 `angular_velocity`：乌龟的线速度和角速度

### ROS 2 的订阅、发布与服务调用

 - **发布（Publisher）**：通过发布器，程序可以向某个话题发布消息。节点通过向 `/turtle1/cmd_vel` 发布 `Twist` 消息控制乌龟的移动

 - **订阅（Subscriber）**：通过订阅器，程序可以订阅某个话题，接收该话题上的消息。节点通过订阅 `/turtle1/pose` 获取乌龟的实时位置信息

 - **服务（Service）**：服务是一种请求-响应机制，可以执行特定任务。比如调用 `/spawn` 服务生成新乌龟，或者调用 `/teleport_absolute` 服务将乌龟传送到指定位置

## 如何构建ROS节点程序

首先，创建好工作区

### 修改构建配置文件

我们的包目录`test01`下，有几个文件，我们首先修改package.xml，这个文件主要是用来描述我们的包需要的依赖项

确保里面有下面这几项，这是我们的构建依赖

```xml
···
  <depend>rclcpp</depend>
  <depend>geometry_msgs</depend>
  <depend>turtlesim</depend>
···
```

然后修改`CMakeLists.txt`，我们要给我们的`test01`包里的每一个程序都添加构建项目

首先我们给第一个C++节点`rectangular_motion.cpp`添加下面的描述

```cmake
···
# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(turtlesim REQUIRED)
find_package(nav_msgs REQUIRED)

# Add executable
add_executable(rectangular_motion src/rectangular_motion.cpp)
ament_target_dependencies(rectangular_motion rclcpp std_msgs geometry_msgs nav_msgs turtlesim)

# Install the executable
install(TARGETS
  rectangular_motion
  DESTINATION lib/${PROJECT_NAME})
···
```

这样就可以开始正式编写我们的C++程序了

如果要添加python脚本，需要在`CMakeLists.txt`中添加下面的几项

```cmake
···
# find dependencies
find_package(rclpy REQUIRED)

install(
  PROGRAMS
  scripts/turtle_spawner.py
  DESTINATION lib/${PROJECT_NAME}
)
···
```

这样colcon也能正确配置我们的python脚本节点，可以正常使用`ros2 run test01 <program-name>`调用

## 代码详解

[第一个 ros2 C++ 节点](/test01/src/rectangular_motion.cpp)通过发布Twist消息让小乌龟跑一个长方形轨迹，并通过订阅 `/turtle1/pose` 话题获取乌龟的当前位置和朝向信息，调整小乌龟的朝向和移动

```bash
# 运行小乌龟节点
ros2 run turtlesim turtlesim_node
# 运行控制节点
ros2 run test01 rectangular_motion
```

存在的问题：

 - 现在小乌龟走的路线不够直，可能是和距离判定有关，没走到位置上就朝向下一个点了，所以走得会有点斜，后面可以修改成 PID 控制，并增加控制点
 - 由于第一个点是朝向下一个点位的，所以实际上会先走到第二个点，最后才会走到第一个点

![alt text](images/test01-rectangular_motion.png)

[第二个python脚本](/test01/scripts/turtle_spawner.py)通过调用 `/spawn` 服务生成新乌龟，并调用 `/teleport_absolute` 服务将乌龟传送到指定位置

```bash
# 运行小乌龟节点
ros2 run turtlesim turtlesim_node
# 运行生成节点
ros2 run test01 turtle_spawner.py
```

![alt text](images/test01-turtle_spawner.png)