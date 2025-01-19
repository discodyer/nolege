---
tags:
  - RISC-V
  - Point-Lio
  - 算法
---
## Point-Lio 算法在K1开发板上的RVV1.0自动向量化加速尝试

### Point-Lio 介绍

[Point-Lio仓库地址在这里](https://github.com/hku-mars/Point-LIO)

这是一个强大的高带宽激光雷达惯性里程计，在我的实验室里广受好评

类似的算法有Fast-Lio和Faster-Lio，但是输出频率都比较低

相应的，Point-Lio对算力要求很高，0.1精细度下可能需要N100以上的CPU计算性能

依靠这个算法，无人机或者其他种类的机器人就能依靠3D激光雷达进行室内定位

### 阶段1

首先尝试在openEuler上编译并运行Point-Lio，确保能正常运行

然后尝试在qemu上模拟riscv架构的openEuler，并用标量指令集工具链编译安装Point-Lio，确保能正常运行

在qemu上开启V扩展，使用自动向量化工具链编译Point-Lio，确保能正常运行

### 阶段2

测试在qemu开启自动向量化前后的性能对比（可能只能统计消耗的时钟周期，因为是qemu模拟所以不能直接计算真实时间）（可能没啥用，还是得看下面这个）

尝试在spacemit k1芯片的开发板上运行，测试开启自动向量化前后的耗时

如果K1在未启用RVV的情况下没法实时运行（比如10min的测试数据集实际计算了30min）就没有实用价值，开启RVV后希望能尽可能提高处理速度，降低延迟

### K1 介绍

[spacemit k1官网](https://www.spacemit.com/key-stone-k1/)

K1是一款八核64位RISC-V AI CPU。Octa-core X60™(RV64GCVB), RVA22, RVV1.0

M1是K1的散热增强版，K1主频是1.6Ghz，M1是1.8Ghz，其他没有区别

标称 2.0TOPS AI 算力

### 阶段3 

如果可能的话，针对RVV1.0进行Point-Lio源码层面的优化，提升性能

初步估计，Point-Lio依赖eigen3和PCL这两个库，可能需要针对这两个库进行优化