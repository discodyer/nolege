---
tags:
  - ROS
  - cartographer
comment: true
---

# 在示例 bag 上运行 Cartographer ROS

现在 Cartographer 和 Cartographer 的 ROS 集成已经安装完成，您可以下载示例 bag 文件（例如 [德意志博物馆](https://en.wikipedia.org/wiki/Deutsches_Museum)的 2D 和 3D bag 采集数据）到已知位置（在本例中为 `~/Downloads`），并使用 `roslaunch` 启动演示。

启动文件将自动启动 `roscore` 和 `rviz`。

> [!WARNING]
> 当您想要运行 cartographer_ros 时，可能需要先通过运行 `source install_isolated/setup.bash` 来配置 ROS 环境（如果您的 shell 是 zsh，请将 bash 替换为 zsh）

## 德意志博物馆 {#deutsches-museum}

下载并启动 2D bag 演示：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_2d/cartographer_paper_deutsches_museum.bag
roslaunch cartographer_ros demo_backpack_2d.launch bag_filename:=${HOME}/Downloads/cartographer_paper_deutsches_museum.bag
```

下载并启动 3D bag 演示：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_3d/with_intensities/b3-2016-04-05-14-14-00.bag
roslaunch cartographer_ros demo_backpack_3d.launch bag_filename:=${HOME}/Downloads/b3-2016-04-05-14-14-00.bag
```

## 纯定位 {#pure-localization}

纯定位使用 2 个不同的 bag 文件。第一个用于生成地图，第二个用于运行纯定位。

下载德意志博物馆的 2D bag 文件：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_2d/b2-2016-04-05-14-44-52.bag
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_2d/b2-2016-04-27-12-31-41.bag
```

生成地图（等待 cartographer_offline_node 完成），然后运行纯定位：

```bash
roslaunch cartographer_ros offline_backpack_2d.launch bag_filenames:=${HOME}/Downloads/b2-2016-04-05-14-44-52.bag
roslaunch cartographer_ros demo_backpack_2d_localization.launch \
   load_state_filename:=${HOME}/Downloads/b2-2016-04-05-14-44-52.bag.pbstream \
   bag_filename:=${HOME}/Downloads/b2-2016-04-27-12-31-41.bag
```

下载德意志博物馆的 3D bag 文件：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_3d/b3-2016-04-05-13-54-42.bag
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/backpack_3d/b3-2016-04-05-15-52-20.bag
```

生成地图（等待 cartographer_offline_node 完成），然后运行纯定位：

```bash
roslaunch cartographer_ros offline_backpack_3d.launch bag_filenames:=${HOME}/Downloads/b3-2016-04-05-13-54-42.bag
roslaunch cartographer_ros demo_backpack_3d_localization.launch \
   load_state_filename:=${HOME}/Downloads/b3-2016-04-05-13-54-42.bag.pbstream \
   bag_filename:=${HOME}/Downloads/b3-2016-04-05-15-52-20.bag
```

## 静态地标 {#static-landmarks}

<iframe width="560" height="315" src="https://www.youtube.com/embed/E2-OD-ycivc" frameborder="0" allowfullscreen></iframe>

```bash
# 下载地标示例 bag 文件
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/mir/landmarks_demo_uncalibrated.bag

# 启动地标演示
roslaunch cartographer_mir offline_mir_100_rviz.launch bag_filename:=${HOME}/Downloads/landmarks_demo_uncalibrated.bag
```

## Revo LDS

下载并启动从 Neato Robotics 吸尘器的低成本 Revo 激光测距传感器捕获的示例 bag：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/revo_lds/cartographer_paper_revo_lds.bag
roslaunch cartographer_ros demo_revo_lds.launch bag_filename:=${HOME}/Downloads/cartographer_paper_revo_lds.bag
```

## PR2

下载并启动从 Willow Garage 的 PR2 R&D 人形机器人捕获的示例 bag：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/pr2/2011-09-15-08-32-46.bag
roslaunch cartographer_ros demo_pr2.launch bag_filename:=${HOME}/Downloads/2011-09-15-08-32-46.bag
```

## Taurob Tracker

下载并启动从 Taurob Tracker 远程操控机器人捕获的示例 bag：

```bash
wget -P ~/Downloads https://storage.googleapis.com/cartographer-public-data/bags/taurob_tracker/taurob_tracker_simulation.bag
roslaunch cartographer_ros demo_taurob_tracker.launch bag_filename:=${HOME}/Downloads/taurob_tracker_simulation.bag
```
