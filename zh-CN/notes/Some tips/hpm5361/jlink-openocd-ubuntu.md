---
tags:
  - tools
comment: true
---
# HPM5300EVK 使用 J-Link 和 OpenOCD 调试

## 1. 适用范围

本手册说明如何在 Ubuntu x86_64 上使用外置 SEGGER J-Link，通过
HPMicro 定制 OpenOCD 调试 HPM5300EVK 上的 HPM5361。内容包括：

- J-Link 与开发板的硬件连接和板载 FT2232 隔离
- Ubuntu 软件包和 USB 权限配置
- 编译支持 `jlink` 和 `hpm_xpi` 的 OpenOCD
- 启动 OpenOCD、连接 RISC-V GDB 和调试程序
- 容器环境和常见错误处理

本文档使用以下路径变量，实际安装到其他路径时只需修改变量值：

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_OPENOCD="$HOME/.local/hpm-openocd"
export HPM_OPENOCD_SRC="$HOME/src/riscv-openocd-hpm"
```

## 2. 先说明一个版本问题

截至 HPMicro OpenOCD `hpm_xpi_v0.5.0`，官方 Linux x86_64 预编译包包含
FTDI 和 HPM XPI Flash 驱动，但没有编入 J-Link adapter 驱动。用该包执行：

```bash
openocd -f probes/jlink.cfg
```

会得到：

```text
Error: The specified adapter driver was not found (jlink)
```

因此，本手册对 J-Link 使用 HPMicro OpenOCD 源码构建方案。不能使用 Ubuntu
仓库中的通用 OpenOCD 替代，因为通用版本通常不包含 HPMicro 的 `hpm_xpi`
Flash 驱动。

## 3. 硬件连接

### 3.1 关闭电源

拔掉开发板的 J1、J8 USB 线和 J-Link USB 线，再调整跳线。不要在目标板和
J-Link 通电时插拔 JTAG 跳线。

### 3.2 断开板载 FT2232 的 JTAG 信号

外置 J-Link 和板载 FT2232 不能同时驱动同一组 JTAG 信号。

HPM5300EVK RevC 应拔掉以下五个跳帽：

| 跳线 | 信号 |
| --- | --- |
| JP3 | TDO |
| JP4 | TDI |
| JP5 | TCK |
| JP6 | TMS |
| JP7 | TRST |

板上 J2 附近也有“使用 JTAG 拔掉跳帽”的丝印。其他硬件修订版应以该修订版
原理图和丝印为准。切回板载 FT2232 时，需要恢复这些跳帽。

### 3.3 连接 J-Link

1. 将 J-Link 的 20-pin JTAG 线连接到开发板 J2，确认 1 脚方向正确。
2. J2 的 VTref 必须能检测到目标板 3.3 V，J-Link 与开发板必须共地。
3. J2 同时提供 TCK、TMS、TDI、TDO、TRST 和 nSRST；不要只接四根 JTAG 线。
4. 使用 J1 USB 给开发板供电。SEGGER 的 HPM5300EVK 指南也指定使用 J1 供电。
5. 如需板载串口，可同时连接 J8 `USB_DEBUG`，但 JP3 至 JP7 必须保持拔出。
6. 使用 Flash 启动时，将 BOOT1、BOOT0 拨码设置为 `OFF, OFF`。
7. 最后连接 J-Link USB。

不要默认使用 J-Link 的供电输出给开发板供电。除非已确认 J-Link 型号、目标板
电流和连接方式都支持该功能，否则应由开发板自己的 J1 供电。

## 4. 安装 Ubuntu 依赖

以下命令已按 Ubuntu 22.04 验证。Ubuntu 24.04 可使用同名软件包。

```bash
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y universe
sudo apt update

sudo apt install -y \
  build-essential git curl ca-certificates \
  autoconf automake libtool pkg-config texinfo \
  libusb-1.0-0-dev libftdi1-dev libhidapi-dev \
  libjaylink-dev libcapstone-dev libudev-dev \
  cmake ninja-build gdb-multiarch usbutils picocom
```

主要依赖的作用：

- `libjaylink-dev`: OpenOCD 的 J-Link adapter 驱动
- `libusb-1.0-0-dev`: USB 访问
- `libftdi1-dev`: 同一次构建中保留 FT2232 支持
- `libhidapi-dev`: CMSIS-DAP 等 HID adapter 支持
- `autoconf`、`automake`、`libtool`: 从 Git 源码生成构建系统

## 5. 安装 HPM SDK

已有 SDK 时跳过本节。下面固定到本文档验证过的 1.12.1：

```bash
git clone --depth 1 --branch v1.12.1 \
  https://github.com/hpmicro/hpm_sdk.git "$HPM_SDK_BASE"

source "$HPM_SDK_BASE/env.sh"
printf 'HPM_SDK_BASE=%s\n' "$HPM_SDK_BASE"
```

官方发布页和压缩包：

- 发布页: <https://github.com/hpmicro/hpm_sdk/releases/tag/v1.12.1>
- SDK ZIP: <https://github.com/hpmicro/hpm_sdk/releases/download/v1.12.1/hpm_sdk_v1.12.1.zip>

## 6. 编译并安装 HPMicro OpenOCD

### 6.1 下载固定版本源码和子模块

目标目录必须不存在。如果以前下载过，应复用原目录或换一个新目录。

```bash
mkdir -p "$HOME/src" "$HOME/.local"

git clone --depth 1 \
  --branch hpm_xpi_v0.5.0 \
  --recurse-submodules \
  --shallow-submodules \
  https://github.com/hpmicro/riscv-openocd.git \
  "$HPM_OPENOCD_SRC"

cd "$HPM_OPENOCD_SRC"
git describe --tags --always
git submodule status
```

源码地址和版本页：

- <https://github.com/hpmicro/riscv-openocd>
- <https://github.com/hpmicro/riscv-openocd/releases/tag/hpm_xpi_v0.5.0>

### 6.2 构建

```bash
cd "$HPM_OPENOCD_SRC"

./bootstrap

./configure \
  --prefix="$HPM_OPENOCD" \
  --enable-internal-jimtcl \
  --enable-jlink \
  --enable-ftdi \
  --disable-werror

make -j"$(nproc)"
make install
```

这里使用源码仓库内置的 Jim Tcl，因此不依赖发行版提供 Jim Tcl 开发包。J-Link
驱动使用 Ubuntu 的 `libjaylink-dev`。如果系统没有 `libjaylink-dev`，源码已经
拉取 libjaylink 子模块，可将配置中的 J-Link 部分改为：

```bash
./configure \
  --prefix="$HPM_OPENOCD" \
  --enable-internal-jimtcl \
  --enable-internal-libjaylink \
  --enable-jlink \
  --enable-ftdi \
  --disable-werror
```

### 6.3 验证安装

```bash
"$HPM_OPENOCD/bin/openocd" --version
ldd "$HPM_OPENOCD/bin/openocd" | grep -E 'jaylink|ftdi|usb'

"$HPM_OPENOCD/bin/openocd" \
  -c 'adapter driver jlink; shutdown'
```

最后一条命令无 `adapter driver was not found` 错误即表示 J-Link adapter 已编入。
`ldd` 中使用系统 libjaylink 时应出现 `libjaylink.so.0`。

## 7. 可选安装 SEGGER J-Link 软件

OpenOCD 通过开源 libjaylink 访问 J-Link，不要求安装 SEGGER J-Link 软件包。
但安装 J-Link Commander 有助于升级探针固件和独立验证硬件连接。

1. 打开 <https://www.segger.com/downloads/jlink/>。
2. 接受 SEGGER 许可协议并下载 Linux 64-bit DEB Installer。
3. 在下载目录安装：

```bash
sudo apt install ./JLink_Linux_V*_x86_64.deb
JLinkExe -version
```

连接测试：

```bash
JLinkExe \
  -device HPM5361xCBx \
  -if JTAG \
  -speed 4000 \
  -autoconnect 1
```

SEGGER 对 HPM5300EVK 的最低要求是 J-Link Software V7.92e。测试完成后退出
J-Link Commander，不能让 `JLinkExe`、Ozone、J-Link GDB Server 和 OpenOCD
同时占用同一只探针。

## 8. 配置 udev USB 权限

不建议使用 `sudo openocd`，也不建议把所有 USB 设备设置成 `0666`。

### 8.1 安装 OpenOCD 自带规则

```bash
sudo groupadd --force plugdev
sudo usermod -aG plugdev,dialout "$USER"

sudo install -m 0644 \
  "$HPM_OPENOCD/share/openocd/contrib/60-openocd.rules" \
  /etc/udev/rules.d/60-openocd.rules

sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

然后拔插 J-Link，并注销、重新登录一次，使 `plugdev` 和 `dialout` 组生效：

```bash
id
lsusb -d 1366:
```

SEGGER J-Link 的 USB Vendor ID 是 `1366`。
`plugdev` 用于探针的原始 USB 访问；连接 J8 查看板载 UART 时还需要 `dialout`。

### 8.2 新型号 PID 未被规则覆盖时

如果 `lsusb` 能看到 `1366:xxxx`，但普通用户仍然收到
`LIBUSB_ERROR_ACCESS`，可增加仅匹配 SEGGER Vendor ID 的规则：

```bash
sudo tee /etc/udev/rules.d/61-segger-jlink-local.rules >/dev/null <<'EOF'
ACTION=="add|change", SUBSYSTEM=="usb", ATTR{idVendor}=="1366", MODE:="0660", GROUP:="plugdev", TAG+="uaccess", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF

sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

再次拔插 J-Link。检查实际节点权限：

```bash
lsusb -d 1366:
# 从 lsusb 输出得到 Bus 和 Device 编号后，例如：
ls -l /dev/bus/usb/001/005
```

如果安装 SEGGER DEB，它通常还会安装自己的 `99-jlink.rules`。两套规则可以
共存，但出现权限行为不一致时，应检查 `/etc/udev/rules.d/` 中是否有旧规则。

## 9. 启动 OpenOCD

### 9.1 检查 USB 和端口

```bash
lsusb -d 1366:
ss -ltnp | grep -E ':(3333|4444|6666)\b' || true
```

如果端口已占用，先退出已有 OpenOCD 或 IDE 调试会话。

### 9.2 启动 GDB Server

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_OPENOCD="$HOME/.local/hpm-openocd"

"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f probes/jlink.cfg \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c 'bindto 127.0.0.1'
```

配置顺序不能任意交换：探针、SoC、开发板。`adapter speed 4000` 放在三个
配置文件之后，用于覆盖 `probes/jlink.cfg` 中默认的 10 MHz。连接稳定后可尝试
10 MHz；长排线或连接不稳定时可降到 1 MHz：

```bash
-c 'adapter speed 1000'
```

成功连接时应能看到以下关键信息：

- J-Link 被打开
- HPM5361 TAP ID 为 `0x1000563d`
- RISC-V target `hpm5361.cpu0` 被识别
- GDB server 监听 `3333`

HPM 配置文件默认使用 `bindto 0.0.0.0`。上面的最后一个参数将其收紧到本机，
避免未经认证的 GDB/Telnet 服务暴露到局域网。确实需要远程调试时再显式改回，
并使用主机防火墙限制来源地址。

## 10. 使用 GDB 调试

保持 OpenOCD 在终端 A 中运行，在终端 B 启动工具链自带 GDB：

```bash
riscv32-unknown-elf-gdb /path/to/demo.elf
```

如果尚未安装 HPMicro GNU 工具链，也可以使用第 4 节安装的 Ubuntu multiarch
GDB；它会根据 ELF 自动识别 RISC-V 架构：

```bash
gdb-multiarch /path/to/demo.elf
```

连接和检查目标：

```gdb
set pagination off
target extended-remote 127.0.0.1:3333
monitor reset halt
monitor targets
info registers
```

调试 RAM 链接的 ELF：

```gdb
load
set $pc = _start
break main
continue
```

调试已经写入 Flash 的 `flash_xip` ELF：

```gdb
monitor reset halt
hbreak main
continue
```

Flash 代码不能靠普通软件断点改写指令，应使用 `hbreak`。HPM5361 的硬件断点
数量有限，不使用时执行 `delete breakpoints` 释放资源。

常用命令：

```gdb
info breakpoints
info registers
x/16wx 0x00000000
x/16wx 0x00080300
x/16wx 0x80000000
stepi
next
continue
monitor reset halt
detach
quit
```

完整的 Dhrystone RAM 下载和 Flash 烧写命令见
[Dhrystone 教程](dhrystone.md)。

## 11. 在 Docker / Dev Container 中使用

udev 规则应安装在连接 USB 的 Ubuntu 宿主机上。容器通常没有运行宿主机的
udev 服务，仅在容器内复制规则不会改变 USB 节点权限。

最稳妥的方式是在宿主机运行 OpenOCD，在容器中只运行 GDB。若 OpenOCD 监听
宿主机网络地址，需把 `bindto` 设置为可从容器访问的地址，并用防火墙限制端口。

如必须在容器中运行 OpenOCD，需要把 `/dev/bus/usb` 传入容器并允许 USB 字符
设备 major 189。示例 Docker 参数：

```bash
--device-cgroup-rule='c 189:* rmw' \
--mount type=bind,source=/dev/bus/usb,target=/dev/bus/usb
```

串口 `/dev/ttyUSB*` 还需要单独传入。设备号会在重新插拔后变化，因此长期使用
时更适合在宿主机打开串口，或通过固定 udev 名称映射。不要为了省事长期使用
`--privileged` 容器。

## 12. 常见错误

### `The specified adapter driver was not found (jlink)`

使用了不含 J-Link 的 HPMicro 预编译包，或使用了裁剪版 OpenOCD。按第 6 节
从源码构建，并执行：

```bash
"$HPM_OPENOCD/bin/openocd" -c 'adapter driver jlink; shutdown'
```

### `Can't find interface/jlink.cfg`

OpenOCD 自带脚本目录没有加入搜索路径。确认命令同时包含：

```bash
-s "$HPM_OPENOCD/share/openocd/scripts"
-s "$HPM_SDK_BASE/boards/openocd"
```

### `libjaylink.so.0: cannot open shared object file`

```bash
sudo apt install -y libjaylink0
sudo ldconfig
```

### `LIBUSB_ERROR_ACCESS` 或 `Permission denied`

检查第 8 节的 udev 规则、`plugdev` 组、重新登录和重新插拔。不要用
`sudo openocd` 掩盖长期权限问题。

### `LIBUSB_ERROR_BUSY`

退出 J-Link Commander、Ozone、J-Link GDB Server、IDE 调试会话和其他
OpenOCD 进程：

```bash
pgrep -af 'openocd|JLink|Ozone'
```

### `Unsupported DTM version: -1` 或无法识别 target

这通常表示 JTAG 没有真正连上，而不是 ELF 问题。依次检查：

1. 开发板是否由 J1 正常供电，J-Link 是否读到 VTref。
2. J2 方向是否正确，nSRST/TRST 是否连接。
3. JP3 至 JP7 是否已拔掉，板载 FT2232 是否已隔离。
4. 将 JTAG 速度降到 1000 kHz。
5. 按 RESET 后重试，或断电重上电。
6. 先用 `JLinkExe` 验证硬件链路，再退出它并启动 OpenOCD。

### `flash driver 'hpm_xpi' not found`

运行的是 Ubuntu 通用 OpenOCD。检查实际二进制：

```bash
type -a openocd
"$HPM_OPENOCD/bin/openocd" --version
```

始终用 `$HPM_OPENOCD/bin/openocd` 启动，避免 PATH 中的 `/usr/bin/openocd`
被误用。

## 13. 参考资料

- HPMicro OpenOCD: <https://github.com/hpmicro/riscv-openocd>
- HPMicro OpenOCD 发布页: <https://github.com/hpmicro/riscv-openocd/releases>
- HPM SDK 调试快速指南: <https://hpm-sdk.readthedocs.io/en/latest/get_started.html>
- SEGGER HPM5300EVK: <https://kb.segger.com/HPMicro_HPM5300EVK>
- SEGGER HPM53 系列: <https://kb.segger.com/HPMicro_HPM53>
- SEGGER J-Link 下载: <https://www.segger.com/downloads/jlink/>
- HPM5300EVK RevC 原理图: <https://www.hpmicro.com/Public/Uploads/uploadfile/files/20240620/HPM5300EVKREVC.pdf>
