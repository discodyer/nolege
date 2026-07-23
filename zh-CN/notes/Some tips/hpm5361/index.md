---
tags:
  - tools
comment: true
---
# HPM5361 / HPM5300EVK 调试与 Dhrystone 使用手册

本文档集面向 Ubuntu x86_64、HPM5300EVK 和板载 HPM5361，覆盖外置
J-Link、板载 FT2232、OpenOCD、udev、GDB 以及 Dhrystone 的完整使用流程。

## 文档入口

| 场景 | 文档 |
| --- | --- |
| 外置 J-Link，通过 OpenOCD 调试 | [J-Link + OpenOCD Ubuntu 使用手册](jlink-openocd-ubuntu.md) |
| 板载 FT2232，通过 OpenOCD 调试 | [板载 FT2232 + OpenOCD Ubuntu 使用手册](ft2232-openocd-ubuntu.md) |
| 编译和运行 Dhrystone，下载到 Flash 或 RAM | [Dhrystone 编译、下载与调试教程](dhrystone.md) |

## 已核对的版本

本文档在 2026-07-22 按以下版本编写和做静态/本地构建验证：

- Ubuntu 22.04 x86_64
- HPM SDK 1.12.1
- HPMicro OpenOCD `hpm_xpi_v0.5.0`
- HPMicro GNU 工具链 GCC 13.2.0，以及 GCC 16.1.0 兼容性验证
- CMake 3.22.1、Ninja 1.10.1
- HPM5300EVK RevC 原理图

较新的 SDK、OpenOCD 或开发板修订版可能改变文件名、跳线编号或配置参数。
升级后应优先核对对应版本的板卡 YAML、OpenOCD 配置和原理图。

## 验证范围

已在无修改的 HPM SDK 1.12.1 检出上完成 GCC 13 的 RAM/Flash 构建，以及 GCC 16
配合 GNU C17 的兼容性构建；也已完成 HPMicro OpenOCD 源码构建，并确认生成的
二进制包含 J-Link、FTDI 和 `hpm_xpi` 支持。由于当前环境没有连接开发板和调试
探针，JTAG 电气连接、实板 Flash 擦写和串口输出仍需按手册在硬件上验证。

## 关键参数

| 项目 | 值 |
| --- | --- |
| SDK 板名 | `hpm5300evk` |
| SoC | `HPM5361` |
| J-Link 设备名 | `HPM5361xCBx` |
| OpenOCD SoC 配置 | `soc/hpm5300.cfg` |
| 板卡配置 | `boards/hpm5300evk.cfg` |
| 板载探针配置 | `probes/ft2232.cfg` |
| 外置探针配置 | `probes/jlink.cfg` |
| JTAG TAP ID | `0x1000563d` |
| OpenOCD GDB 端口 | `3333` |
| OpenOCD Tcl 端口 | `6666` |
| OpenOCD Telnet 端口 | `4444` |
| QSPI NOR Flash 映射地址 | `0x80000000` |
| 板载 Flash 容量 | 1 MiB |
| ILM | `0x00000000`，128 KiB |
| DLM | `0x00080300`，约 127.25 KiB |
| 调试串口 | UART0，115200 8N1 |

## 官方资源

- HPM SDK: <https://github.com/hpmicro/hpm_sdk>
- HPM SDK 1.12.1: <https://github.com/hpmicro/hpm_sdk/releases/tag/v1.12.1>
- HPMicro OpenOCD: <https://github.com/hpmicro/riscv-openocd>
- HPMicro OpenOCD 发布页: <https://github.com/hpmicro/riscv-openocd/releases>
- HPMicro GNU 工具链: <https://github.com/hpmicro/riscv-gnu-toolchain/releases>
- SEGGER J-Link 下载页: <https://www.segger.com/downloads/jlink/>
- SEGGER HPM5300EVK 说明: <https://kb.segger.com/HPMicro_HPM5300EVK>
- HPM5300EVK RevC 原理图: <https://www.hpmicro.com/Public/Uploads/uploadfile/files/20240620/HPM5300EVKREVC.pdf>
- HPM SDK 在线文档: <https://hpm-sdk.readthedocs.io/>
