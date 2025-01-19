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