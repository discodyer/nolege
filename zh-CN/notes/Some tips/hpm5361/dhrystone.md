---
tags:
  - tools
comment: true
---
# HPM5361 Dhrystone 编译、下载与调试教程

## 1. Dhrystone 是什么

Dhrystone 2.1 是一个经典的整数 CPU 合成基准，主要包含整数运算、分支、函数
调用、结构体、数组和字符串操作。HPM SDK 已经移植了 Dhrystone，样例位于：

```text
$HPM_SDK_BASE/samples/dhrystone
```

HPM 版本使用机器定时器 `MTIME` 计时，通过板级 UART 输出结果。样例默认：

- `LOOP_COUNT=18000000`
- `-O3`
- `-fno-inline`
- 调试串口 UART0，115200 8N1

Dhrystone 不是 DSP、浮点、P 扩展或存储带宽测试，不能用它判断 P 扩展指令是否
被编译器和 MCU 支持。它适合在固定编译器、优化参数、时钟、缓存和存储执行位置
下做整数性能对比。

## 2. 本教程的两种运行方式

| 方式 | CMake 参数 | 代码位置 | 断电后是否保留 | 适用场景 |
| --- | --- | --- | --- | --- |
| JTAG 下载到 RAM | `HPM_BUILD_TYPE=ram` | ILM/DLM | 否 | 快速调试、反复修改 |
| JTAG 写入 Flash | `HPM_BUILD_TYPE=flash_xip` | QSPI NOR XIP | 是 | 独立启动、正式跑分 |

这两种 ELF 的链接地址不同，不能混用：

- RAM ELF 入口：`0x00000000`
- Flash XIP ELF 入口：`0x80003000`

不能把 RAM 版 `demo.bin` 直接写到 `0x80000000` 运行。Flash 版包含 HPM 启动所需
的 NOR 配置、boot header 和 XIP 布局，必须单独构建。

## 3. Ubuntu 环境准备

### 3.1 安装基础软件包

Ubuntu 22.04/24.04 x86_64：

```bash
sudo apt update
sudo apt install -y \
  build-essential git curl ca-certificates tar \
  cmake ninja-build python3 \
  libncursesw6 libtinfo6 libexpat1 libmpfr6 libgmp10 \
  libusb-1.0-0 libftdi1-2 libhidapi-hidraw0 \
  usbutils picocom
```

其中 `libncursesw6`、`libtinfo6`、`libexpat1`、`libmpfr6` 和 `libgmp10` 是官方
工具链内 GDB 在 Ubuntu 上使用的运行库。

OpenOCD 和 udev 配置根据使用的探针完成对应手册：

- [外置 J-Link + OpenOCD](jlink-openocd-ubuntu.md)
- [板载 FT2232 + OpenOCD](ft2232-openocd-ubuntu.md)

### 3.2 安装 HPMicro GNU 工具链

推荐使用 HPMicro 官方 GCC 13.2.0 multilib 包：

- 发布页: <https://github.com/hpmicro/riscv-gnu-toolchain/releases/tag/2023.10.18>
- Linux x86_64 包: <https://github.com/hpmicro/riscv-gnu-toolchain/releases/download/2023.10.18/rv32imac_zicsr_zifencei_multilib_b_ext-linux.tar.gz>

下载并解压：

```bash
export HPM_TOOLCHAIN="$HOME/.local/hpm-riscv32-gcc-13.2.0"
mkdir -p "$HOME/Downloads" "$HPM_TOOLCHAIN"

curl -fL --retry 3 \
  -o "$HOME/Downloads/hpm-riscv32-gcc-13.2.0.tar.gz" \
  https://github.com/hpmicro/riscv-gnu-toolchain/releases/download/2023.10.18/rv32imac_zicsr_zifencei_multilib_b_ext-linux.tar.gz

echo '550e867c86d14e0a1fddfde4d9316f7485a396474311c5d8ab61ebff5492ce17  '"$HOME/Downloads/hpm-riscv32-gcc-13.2.0.tar.gz" \
  | sha256sum -c -

tar -xzf "$HOME/Downloads/hpm-riscv32-gcc-13.2.0.tar.gz" \
  -C "$HPM_TOOLCHAIN" \
  --strip-components=1
```

配置环境变量并验证：

```bash
export GNURISCV_TOOLCHAIN_PATH="$HPM_TOOLCHAIN"
export PATH="$GNURISCV_TOOLCHAIN_PATH/bin:$PATH"
unset HPM_SDK_TOOLCHAIN_VARIANT

riscv32-unknown-elf-gcc --version
riscv32-unknown-elf-gdb --version
```

应分别显示 GCC 13.2.0 和 GDB 13.2。

`GNURISCV_TOOLCHAIN_PATH` 必须指向工具链根目录，不能指向 `bin`。SDK 会自动
拼接：

```text
$GNURISCV_TOOLCHAIN_PATH/bin/riscv32-unknown-elf-gcc
```

如果设置为 `$HPM_TOOLCHAIN/bin`，SDK 会错误查找 `bin/bin/...`。

### 3.3 安装 HPM SDK 1.12.1

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"

git clone --depth 1 --branch v1.12.1 \
  https://github.com/hpmicro/hpm_sdk.git "$HPM_SDK_BASE"

source "$HPM_SDK_BASE/env.sh"
```

资源：

- 发布页: <https://github.com/hpmicro/hpm_sdk/releases/tag/v1.12.1>
- SDK ZIP: <https://github.com/hpmicro/hpm_sdk/releases/download/v1.12.1/hpm_sdk_v1.12.1.zip>
- 在线文档: <https://hpm-sdk.readthedocs.io/>

### 3.4 每个新终端需要的环境变量

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_TOOLCHAIN="$HOME/.local/hpm-riscv32-gcc-13.2.0"
export GNURISCV_TOOLCHAIN_PATH="$HPM_TOOLCHAIN"
export PATH="$GNURISCV_TOOLCHAIN_PATH/bin:$PATH"
unset HPM_SDK_TOOLCHAIN_VARIANT
source "$HPM_SDK_BASE/env.sh"
```

`source env.sh` 还会设置 SDK 的 OpenOCD 脚本目录。本文教程的 OpenOCD 命令仍
使用显式 `-s`，避免不同 OpenOCD 安装之间发生脚本路径混淆。

## 4. 编译 RAM 版本

使用独立构建目录，不要和 Flash 构建共用 CMake cache：

```bash
cd "$HPM_SDK_BASE/samples/dhrystone"

cmake -S . -B build-ram -GNinja \
  -DBOARD=hpm5300evk \
  -DHPM_BUILD_TYPE=ram \
  -DCMAKE_BUILD_TYPE=release \
  '-DCMAKE_C_FLAGS=-std=gnu17'

cmake --build build-ram -j"$(nproc)"
```

生成文件：

```text
build-ram/output/demo.elf
build-ram/output/demo.bin
build-ram/output/demo.asm
build-ram/output/demo.map
```

检查入口和段地址：

```bash
riscv32-unknown-elf-readelf -h build-ram/output/demo.elf \
  | grep 'Entry point'

riscv32-unknown-elf-readelf -l build-ram/output/demo.elf
```

RAM 版入口应为：

```text
Entry point address: 0x0
```

程序代码通过 JTAG 装入 ILM，初始化数据镜像也会按 ELF 的物理装载地址写入 RAM；
启动代码再把数据复制到 DLM。

## 5. 编译 Flash XIP 版本

```bash
cd "$HPM_SDK_BASE/samples/dhrystone"

cmake -S . -B build-flash -GNinja \
  -DBOARD=hpm5300evk \
  -DHPM_BUILD_TYPE=flash_xip \
  -DCMAKE_BUILD_TYPE=release \
  '-DCMAKE_C_FLAGS=-std=gnu17'

cmake --build build-flash -j"$(nproc)"
```

生成文件：

```text
build-flash/output/demo.elf
build-flash/output/demo.bin
build-flash/output/demo.asm
build-flash/output/demo.map
```

检查入口：

```bash
riscv32-unknown-elf-readelf -h build-flash/output/demo.elf \
  | grep 'Entry point'

riscv32-unknown-elf-readelf -l build-flash/output/demo.elf
```

Flash 版入口应为：

```text
Entry point address: 0x80003000
```

HPM5361 `flash_xip.ld` 的关键布局：

| 内容 | 地址 |
| --- | --- |
| QSPI NOR 映射基址 | `0x80000000` |
| NOR 配置选项 | `0x80000400` |
| Boot header | `0x80001000` |
| 应用入口 | `0x80003000` |

`demo.elf` 中还包含启动时复制到 ILM/DLM 的段的 Flash load address。烧写时推荐
始终使用 ELF，让 OpenOCD 根据 ELF 的物理地址处理所有段。

## 6. GCC 16/C23 的兼容问题

Dhrystone 2.1 来自 1988 年，使用 K&R 风格函数声明，例如：

```c
Enumeration Func_1 ();
```

GCC 16 默认使用 C23。在 C23 中，`Func_1()` 表示函数不接受参数，因而会报：

```text
error: too many arguments to function 'Func_1'; expected 0, have 2
```

本教程在两个 CMake 命令中都显式加入：

```text
-DCMAKE_C_FLAGS=-std=gnu17
```

因此 GCC 13 和 GCC 16 都能构建，且不需要修改 SDK 源码。旧式函数定义警告来自
Dhrystone 原始代码，在 GNU C17 下可接受。

如果已有 build 目录曾被其他工具链或 C 标准配置过，应换一个新的 build 目录，
不要仅重复执行 `cmake --build`。

## 7. 选择调试探针和 OpenOCD

先按对应手册完成硬件、OpenOCD 和 udev 配置。

### 7.1 板载 FT2232

```bash
export HPM_PROBE=ft2232
export HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"
```

参见 [板载 FT2232 手册](ft2232-openocd-ubuntu.md)。JP3 至 JP7 应安装，J8
连接主机并通常同时为 RevC 开发板供电，J2 不连接外置探针。

### 7.2 外置 J-Link

```bash
export HPM_PROBE=jlink
export HPM_OPENOCD="$HOME/.local/hpm-openocd"
```

参见 [J-Link 手册](jlink-openocd-ubuntu.md)。HPM5300EVK RevC 的 JP3 至 JP7
应拔掉，J-Link 接 J2，开发板由 J1 供电。

J-Link 必须使用手册中带 `jlink` driver 的源码构建版 HPM OpenOCD。当前
`hpm_xpi_v0.5.0` Linux 预编译包不能用于 J-Link。

### 7.3 定义公共路径

```bash
export RAM_ELF="$HPM_SDK_BASE/samples/dhrystone/build-ram/output/demo.elf"
export FLASH_ELF="$HPM_SDK_BASE/samples/dhrystone/build-flash/output/demo.elf"
export FLASH_BIN="$HPM_SDK_BASE/samples/dhrystone/build-flash/output/demo.bin"

test -f "$RAM_ELF"
test -f "$FLASH_ELF"
test -x "$HPM_OPENOCD/bin/openocd"
```

以下所有 OpenOCD 命令都使用同一个探针变量：

```text
probes/ft2232.cfg
```

或：

```text
probes/jlink.cfg
```

## 8. 打开串口查看结果

Dhrystone 输出到 115200 8N1 调试串口。使用板载 FT2232 时，通常是 FT2232 B
通道；使用外置 J-Link 时，也可以连接 J8 只使用其串口通道。

查找设备：

```bash
ls -l /dev/serial/by-id/ 2>/dev/null || true
ls -l /dev/ttyUSB* 2>/dev/null || true
```

如果有两个 FTDI 节点，使用 interface `01` 的 B 通道：

```bash
for dev in /dev/ttyUSB*; do
  [ -e "$dev" ] || continue
  echo "=== $dev ==="
  udevadm info -q property -n "$dev" \
    | grep -E 'ID_USB_INTERFACE_NUM|ID_SERIAL='
done
```

打开串口，把设备名替换为实际值：

```bash
picocom --baud 115200 --databits 8 --parity n --stopbits 1 /dev/ttyUSB1
```

先打开串口，再下载或复位程序，避免错过启动输出。

## 9. 通过 JTAG 直接下载到 RAM 并运行

RAM 下载不会修改 Flash，掉电或复位后不再保留。下面提供 OpenOCD 一键运行和
GDB 交互调试两种方式。

### 9.1 OpenOCD 一条命令加载并运行

先确认没有另一个 OpenOCD 正在占用探针。然后执行：

```bash
"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c "init; reset halt; load_image {$RAM_ELF}; verify_image {$RAM_ELF}; resume 0x00000000; shutdown"
```

命令依次完成：

1. 初始化 JTAG 并复位、暂停 HPM5361。
2. 根据 RAM ELF 的段地址写入 ILM/DLM 装载镜像。
3. 读回校验。
4. 从 `0x00000000` 恢复执行。
5. 关闭 OpenOCD，MCU 继续运行。

串口应立即出现 Dhrystone 输出。

### 9.2 使用 GDB 加载并停在 `main`

终端 A 启动 OpenOCD GDB Server：

```bash
"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c 'bindto 127.0.0.1'
```

终端 B 启动 GDB：

```bash
"$GNURISCV_TOOLCHAIN_PATH/bin/riscv32-unknown-elf-gdb" \
  -q "$RAM_ELF" \
  -ex 'set pagination off' \
  -ex 'target extended-remote 127.0.0.1:3333' \
  -ex 'monitor reset halt' \
  -ex 'load' \
  -ex 'set $pc = _start' \
  -ex 'break main' \
  -ex 'continue'
```

GDB 停在 `main` 后，可检查代码和变量：

```gdb
list
info registers
next
```

正式跑分前删除断点，然后重新复位、加载并连续运行。单步或断点停顿会破坏计时：

```gdb
delete breakpoints
monitor reset halt
load
set $pc = _start
continue
```

停止调试：

```gdb
detach
quit
```

## 10. 通过 JTAG 写入 Flash 并运行

### 10.1 烧写前检查

1. BOOT1、BOOT0 设置为 `OFF, OFF`，即 Quad SPI NOR Flash 启动。
2. 使用的是 `build-flash/output/demo.elf`，不是 RAM ELF。
3. 使用 HPMicro 定制 OpenOCD，不是 Ubuntu 通用 OpenOCD。
4. 串口已经打开。
5. 没有其他 OpenOCD、IDE 或 J-Link 软件占用探针。

### 10.2 推荐：烧写 ELF、校验、复位运行

```bash
"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c "program {$FLASH_ELF} verify reset exit"
```

`program` 会初始化目标、执行 reset-init、擦除涉及的扇区、按 ELF 物理地址写入、
读回校验、复位运行并退出 OpenOCD。成功日志应包含：

```text
** Programming Started **
** Programming Finished **
** Verify Started **
** Verified OK **
** Resetting Target **
```

Flash 写入会覆盖相应扇区原有内容。HPM5300EVK 板载 Flash 为 1 MiB，SDK 链接
脚本会将应用限制在该容量内。

### 10.3 备用：烧写 BIN

只有确认该 BIN 来自 `flash_xip` 构建时才使用：

```bash
"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c "program {$FLASH_BIN} 0x80000000 verify reset exit"
```

BIN 没有地址元数据，因此必须显式提供 `0x80000000`。写错基址可能破坏启动
布局。ELF 方式更安全，也更适合调试。

### 10.4 断电独立运行

烧写成功后：

1. 确认 BOOT1、BOOT0 仍为 `OFF, OFF`。
2. 退出 OpenOCD/GDB。
3. 断开调试器不是必需，但可用于验证独立运行。
4. 重新给开发板上电或按 RESET。

Dhrystone 应从 QSPI NOR Flash 启动并输出结果。

## 11. 调试已经写入 Flash 的程序

终端 A 启动 OpenOCD Server：

```bash
"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c 'bindto 127.0.0.1'
```

终端 B 加载符号并使用硬件断点：

```bash
"$GNURISCV_TOOLCHAIN_PATH/bin/riscv32-unknown-elf-gdb" \
  -q "$FLASH_ELF" \
  -ex 'set pagination off' \
  -ex 'target extended-remote 127.0.0.1:3333' \
  -ex 'monitor reset halt' \
  -ex 'hbreak main' \
  -ex 'continue'
```

使用 `hbreak` 而不是 `break`，因为 Flash XIP 代码不能通过改写指令插入软件
断点。HPM5361 的硬件断点数量有限。

正式跑分时不要停在 `main`，而是清除所有断点后复位并连续执行：

```gdb
delete breakpoints
monitor reset run
detach
quit
```

## 12. 结果输出和解释

程序首先输出正确性检查值，最后输出类似：

```text
Dhrystone Benchmark, Version 2.1 (Language: C)
Execution starts, 18000000 runs through Dhrystone
Execution ends
...
CPU frequency:                      ... MHz
Microseconds for one run through Dhrystone: ...
Dhrystones per Second:                      ...
DMIPS per Second:                      ...
```

所有 `should be` 值都应匹配。任何值不一致时，该次性能数字无效。

Dhrystone 标准换算通常使用：

```text
DMIPS = Dhrystones_per_second / 1757
DMIPS/MHz = Dhrystones_per_second / 1757 / CPU_MHz
```

HPM SDK 1.12.1 源码中的 `DMIPS_Per_Mhz` 实际按第二个公式计算，但打印标签是
`DMIPS per Second`。因此该行数值应按 **DMIPS/MHz** 解读，不是 DMIPS/s。

比较结果时至少记录：

- MCU 型号和 CPU 频率
- RAM 或 Flash XIP 运行位置
- SDK、编译器和 OpenOCD 版本
- 完整编译选项和 `LOOP_COUNT`
- Cache 状态和板卡修订版

RAM 与 Flash XIP 的取指路径不同，不能把两者结果当成相同测试条件直接比较。

## 13. 常见问题

### CMake 查找 `/bin/bin/riscv32-unknown-elf-gcc`

工具链路径多写了一层 `bin`：

```bash
export GNURISCV_TOOLCHAIN_PATH="$HOME/.local/hpm-riscv32-gcc-13.2.0"
```

而不是：

```bash
export GNURISCV_TOOLCHAIN_PATH="$HOME/.local/hpm-riscv32-gcc-13.2.0/bin"
```

换新 build 目录后重新配置。

### `HPM_SDK_BASE is not set yet`

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
source "$HPM_SDK_BASE/env.sh"
```

### `too many arguments to function 'Func_1'`

当前 GCC 默认 C23。重新用新目录配置，并保留：

```text
'-DCMAKE_C_FLAGS=-std=gnu17'
```

### `cannot find -lc`、ABI 或 multilib 错误

检查是否完整解压官方工具链，而不只是复制了几个 `bin` 文件：

```bash
riscv32-unknown-elf-gcc -print-multi-lib
riscv32-unknown-elf-gcc -print-sysroot
```

确认 `GNURISCV_TOOLCHAIN_PATH` 指向同一个完整工具链根目录。

### OpenOCD 找不到 `hpm_xpi`

使用了 Ubuntu 通用 OpenOCD。检查：

```bash
type -a openocd
"$HPM_OPENOCD/bin/openocd" --version
```

使用 HPMicro OpenOCD 的绝对路径。

### Flash 烧写校验失败

1. 将 `adapter speed` 降到 `1000`。
2. 确认开发板供电稳定，按 RESET 或重新上电。
3. 确认加载了 `probes/...`、`soc/hpm5300.cfg`、`boards/hpm5300evk.cfg`。
4. 确认烧写的是 `build-flash/output/demo.elf`。
5. J-Link 场景确认 JP3 至 JP7 已拔掉；FT2232 场景确认它们已安装。

### RAM 下载后按 RESET 程序消失

这是预期行为。RESET 后芯片重新走启动流程，不会自动重新加载 RAM ELF。需要
再次执行 `load`，或改用 `flash_xip` 构建写入 Flash。

### 串口没有输出

1. 先确认串口为 115200 8N1。
2. 检查选择的是 FT2232 B 通道/interface `01`。
3. 先打开串口再复位或下载。
4. 检查程序是否停在 GDB 断点。
5. RAM 版本确认 PC 从 `0x0` 开始；Flash 版本确认 BOOT 拨码为 `OFF, OFF`。

### `Measured time too small to obtain meaningful results`

测试总时间小于样例要求的 2 秒。默认 18000000 次通常足够；如果修改过
`LOOP_COUNT`，应增大它并重新构建。改变循环次数时需在结果记录中注明。

## 14. 最短命令清单

环境：

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_TOOLCHAIN="$HOME/.local/hpm-riscv32-gcc-13.2.0"
export GNURISCV_TOOLCHAIN_PATH="$HPM_TOOLCHAIN"
export PATH="$GNURISCV_TOOLCHAIN_PATH/bin:$PATH"
unset HPM_SDK_TOOLCHAIN_VARIANT
source "$HPM_SDK_BASE/env.sh"
```

编译两种版本：

```bash
cd "$HPM_SDK_BASE/samples/dhrystone"

cmake -S . -B build-ram -GNinja -DBOARD=hpm5300evk \
  -DHPM_BUILD_TYPE=ram -DCMAKE_BUILD_TYPE=release \
  '-DCMAKE_C_FLAGS=-std=gnu17'
cmake --build build-ram -j"$(nproc)"

cmake -S . -B build-flash -GNinja -DBOARD=hpm5300evk \
  -DHPM_BUILD_TYPE=flash_xip -DCMAKE_BUILD_TYPE=release \
  '-DCMAKE_C_FLAGS=-std=gnu17'
cmake --build build-flash -j"$(nproc)"
```

选择板载 FT2232：

```bash
export HPM_PROBE=ft2232
export HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"
```

或选择外置 J-Link：

```bash
export HPM_PROBE=jlink
export HPM_OPENOCD="$HOME/.local/hpm-openocd"
```

RAM 一键加载运行：

```bash
export RAM_ELF="$HPM_SDK_BASE/samples/dhrystone/build-ram/output/demo.elf"

"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" -f soc/hpm5300.cfg -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c "init; reset halt; load_image {$RAM_ELF}; verify_image {$RAM_ELF}; resume 0; shutdown"
```

Flash 一键烧写运行：

```bash
export FLASH_ELF="$HPM_SDK_BASE/samples/dhrystone/build-flash/output/demo.elf"

"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f "probes/${HPM_PROBE}.cfg" -f soc/hpm5300.cfg -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c "program {$FLASH_ELF} verify reset exit"
```
