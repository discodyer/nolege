---
tags:
  - eigen3
  - RISC-V
  - 性能测试
---

# eigen3 库在 RISC-V RVV1.0 上的性能测试

本文旨在对比eigen3库在RISC-V RVV1.0上的表现，与未添加RVV指令集支持的编译版本对比，同时和另外一个经过优化的[非主线版本](https://gitlab.com/libeigen/eigen/-/merge_requests/1687)进行对比，测试三者在同一款芯片上的性能差异，评估eigen3在RISC-V架构下的性能表现

eigen是一个常用的注重性能的单头文件线性代数模板库，库本身是一堆头文件构成的，所以无需编译。测试他的性能可以使用库自带的性能测试工具进行评估。

这个未合并的补丁[RISC-V RVV1.0 support](https://gitlab.com/libeigen/eigen/-/merge_requests/1687)增加了对 RISCV 矢量扩展 RVV1.0 的支持。该实现基于先前实现的 ARM SVE 支持。

因此，我们的预期行为是，在未使用`-march=rv64gcv_zvl256b`编译器参数的时候，性能应该会比启用RVV后好一些，在打了上述补丁后，性能应该会更好。

## 测试环境

### 测试的硬件环境

- 开发板：SpacemitT Muse Pi Pro
- 处理器：Spacemit(R) X60 8核心 M1 芯片 
- CPUInfo:
```
model name      : Spacemit(R) X60
isa             : rv64imafdcv_zicbom_zicboz_zicntr_zicond_zicsr_zifencei_zihintpause_zihpm_zfh_zfhmin_zca_zcd_zba_zbb_zbc_zbs_zkt_zve32f_zve32x_zve64d_zve64f_zve64x_zvfh_zvfhmin_zvkt_sscofpmf_sstc_svinval_svnapot_svpbmt
mmu             : sv39
uarch           : spacemit,x60
mvendorid       : 0x710
marchid         : 0x8000000058000001
mimpid          : 0x1000000049772200
```

在 X60 智算核中，RISC-V Vector 的位宽为 256 位，其 matrix 及 vector 理论算力展示如下。

Matrix 算力: 0.5 TOPS/Core (Int8), 2 TOPS/Cluster (Int8)

Vector 算力：

    0.128 TOPS/Core (Int8), 0.5 TOPS/Cluster (Int8)
    0.064 TOPS/Core (FP16), 0.25 TOPS/Cluster (FP16)
    0.032 TOPS/Core (FP32)

Matrix 算力，以**专用加速指令**的方式提供，不在本文讨论范围内，采用 RISC-V custom-1 的编码空间，操作数和结果保存复用 RVV 的 VPR 寄存器。详细扩展指令描述可以参考指令集手册 https://github.com/spacemit-com

### 测试使用的工具链

- LLVM-18 bianbu 软件源 eigen-3.4.0 编译失败
- LLVM-19 bianbu 软件源 eigen-3.4.0 编译失败
- GCC 13 bianbu 系统预装 eigen-3.4.0 编译失败
- LLVM-19 X86交叉编译
- GCC 15 

### 测试使用的命令

[eigen3 官方教程](https://eigen.tuxfamily.org/index.php?title=How_to_run_the_benchmark_suite)

```
# create a working directory
$ mkdir build
$ cd build
# create the makefiles
$ cmake <path_to_eigen_source> -DCMAKE_BUILD_TYPE=Release -DEIGEN_BUILD_BTL=ON -DEIGEN3_INCLUDE_DIR=<path_to_eigen_source>
# compile the benchmarks
$ cd bench/btl
$ make -j4
# run the benchmark (on a single core)
# VERY IMPORTANT : logout, log into a console (ctrl+shift+F1) and shutdown your X server (e.g.: sudo init 3), and stop as most as services as you can
$ OMP_NUM_THREADS=1 ctest -V
# - go sleep -
# copy the results into the same directory
$ mkdir data/set1
$ cp libs/*/*.dat data/set1
# build the nice plots
$ cd data
$ ./go_mean set1/
# the plots (png and pdf files) are in set1/
```

环境变量

```
export RISCVCC_FLAGS="-march=rv64imafdcv_zvl256b -mrvv-vector-bits=256 -DEIGEN_RISCV64_USE_RVV10"
```

CMake命令

```
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DEIGEN_BUILD_TESTS=ON \
    -DEIGEN_BUILD_BTL=ON \
    -DEIGEN_BUILD_PKGCONFIG=ON \
    -DCMAKE_C_COMPILER=${RISCVCC_PREFIX}clang-19 \
    -DCMAKE_CXX_COMPILER=${RISCVCC_PREFIX}clang++-19 \
    -DCMAKE_C_FLAGS="${RISCVCC_FLAGS}" \
    -DCMAKE_CXX_FLAGS="${RISCVCC_FLAGS}" \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON \
    -DCMAKE_SYSTEM_NAME=Linux \
    -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
    -DCMAKE_INSTALL_PREFIX=./install \
    -DCMAKE_BINARY_DIR=./

```

<!-- ```
btl/libs/tensors/tensor_interface.hh
第71行改为：
A_stl[j][i] = A.coeff(Eigen::array<Index,2>{{i,j}});
第78行和第84行，改为：
const Eigen::array<DimPair, 1> dims{{DimPair(1, 0)}};
``` -->