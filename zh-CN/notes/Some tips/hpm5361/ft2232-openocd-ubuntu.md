---
tags:
  - tools
comment: true
---
# HPM5300EVK 使用板载 FT2232 和 OpenOCD 调试

## 1. 适用范围

HPM5300EVK 集成 FT2232HL 调试器。其典型分工是：

- FT2232 A 通道：MPSSE JTAG，连接 HPM5361
- FT2232 B 通道：UART，连接开发板调试串口

一根连接 J8 `USB_DEBUG` 的 USB Type-C 线即可同时提供 JTAG、串口和开发板
供电。HPM5300EVK RevC 的 J8 VBUS 通过板载电源路径接入主电源，常规使用不需要
再连接 J1。本文档使用 HPMicro OpenOCD `hpm_xpi_v0.5.0` 的官方 Linux x86_64
预编译包；该包支持 FT2232 和 HPM XPI Flash。

本文档使用以下路径：

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"
```

## 2. 硬件设置

1. 确认板载调试器的 JTAG 跳帽已安装。
2. HPM5300EVK RevC 对应 JP3 至 JP7：TDO、TDI、TCK、TMS、TRST。
3. 不要同时在 J2 连接外置 J-Link 或其他调试探针。
4. 将 BOOT1、BOOT0 设置为 `OFF, OFF`，用于正常 QSPI NOR Flash 启动。
5. 使用支持数据传输的 USB Type-C 线连接 J8 `USB_DEBUG` 到 Ubuntu 主机；RevC
   通常由这根线同时供电。
6. 确认开发板电源指示正常。J1 可作为另一供电入口，但板载调试不要求 J1 和 J8
   同时接入。

如果之前使用外置 J-Link 并拔掉了 JP3 至 JP7，应先断电、恢复跳帽，再重新上电。

## 3. 安装 Ubuntu 依赖

```bash
sudo apt update
sudo apt install -y \
  git curl ca-certificates tar \
  libusb-1.0-0 libftdi1-2 libhidapi-hidraw0 \
  cmake ninja-build gdb-multiarch usbutils picocom
```

如果还需要从源码构建应用：

```bash
sudo apt install -y build-essential python3
```

## 4. 安装 HPM SDK

已有 SDK 时跳过。以下命令固定到 1.12.1：

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"

git clone --depth 1 --branch v1.12.1 \
  https://github.com/hpmicro/hpm_sdk.git "$HPM_SDK_BASE"

source "$HPM_SDK_BASE/env.sh"
```

资源：

- <https://github.com/hpmicro/hpm_sdk/releases/tag/v1.12.1>
- <https://github.com/hpmicro/hpm_sdk/releases/download/v1.12.1/hpm_sdk_v1.12.1.zip>

## 5. 安装 HPMicro OpenOCD 预编译包

### 5.1 下载和校验

本文档验证版本：

- 标签：`hpm_xpi_v0.5.0`
- 文件：`openocd-linux-x86_64.tar.gz`
- SHA-256：`c1ab35677acfbd7663d7a88eb1631ff76e3d96e0d85a43d8601acd6dc6bc8f4a`

```bash
export HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"
mkdir -p "$HOME/Downloads" "$HPM_OPENOCD"

curl -fL --retry 3 \
  -o "$HOME/Downloads/openocd-linux-x86_64-hpm_xpi_v0.5.0.tar.gz" \
  https://github.com/hpmicro/riscv-openocd/releases/download/hpm_xpi_v0.5.0/openocd-linux-x86_64.tar.gz

echo 'c1ab35677acfbd7663d7a88eb1631ff76e3d96e0d85a43d8601acd6dc6bc8f4a  '"$HOME/Downloads/openocd-linux-x86_64-hpm_xpi_v0.5.0.tar.gz" \
  | sha256sum -c -
```

发布页：<https://github.com/hpmicro/riscv-openocd/releases/tag/hpm_xpi_v0.5.0>

### 5.2 解压

发布包内部是 `usr/local/bin` 和 `usr/local/share`，因此去掉前两层目录：

```bash
tar -xzf "$HOME/Downloads/openocd-linux-x86_64-hpm_xpi_v0.5.0.tar.gz" \
  -C "$HPM_OPENOCD" \
  --strip-components=2

"$HPM_OPENOCD/bin/openocd" --version
ldd "$HPM_OPENOCD/bin/openocd" | grep -E 'ftdi|usb|hidapi'
```

预期版本类似：

```text
Open On-Chip Debugger 0.12.0+dev-snapshot (2026-06-30-01:42)
```

不推荐直接执行 `sudo tar -C / -xzf ...`，因为这会覆盖 `/usr/local` 中现有文件，
也难以和 Ubuntu 的 `/usr/bin/openocd` 区分。

### 5.3 可选加入 PATH

```bash
printf '\nexport HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"\nexport PATH="$HPM_OPENOCD/bin:$PATH"\n' \
  >> "$HOME/.bashrc"
source "$HOME/.bashrc"
type -a openocd
```

即使加入 PATH，自动化脚本仍建议使用 `$HPM_OPENOCD/bin/openocd` 的绝对路径。

## 6. 配置 udev 权限

FT2232HL 的默认 USB VID:PID 是 `0403:6010`。使用组权限和 `uaccess`，不要长期
以 root 运行 OpenOCD。

### 6.1 使用 OpenOCD 自带规则

```bash
sudo groupadd --force plugdev
sudo usermod -aG plugdev,dialout "$USER"

sudo install -m 0644 \
  "$HPM_OPENOCD/share/openocd/contrib/60-openocd.rules" \
  /etc/udev/rules.d/60-openocd.rules

sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

拔插 J8 USB，并注销、重新登录一次，使 `plugdev` 和 `dialout` 组生效：

```bash
id
lsusb -d 0403:6010
```

### 6.2 只安装最小 FT2232 规则

如果不希望安装 OpenOCD 的完整探针规则，可改用最小规则：

```bash
sudo tee /etc/udev/rules.d/61-hpm5300evk-ft2232.rules >/dev/null <<'EOF'
ACTION=="add|change", SUBSYSTEM=="usb", ATTR{idVendor}=="0403", ATTR{idProduct}=="6010", MODE:="0660", GROUP:="plugdev", TAG+="uaccess", ENV{ID_MM_DEVICE_IGNORE}="1"
EOF

sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

两种方案选一种即可。HPM SDK 还提供 `scripts/linux/udev_rules`，但其中部分旧规则
使用 `MODE="0666"` 或宽泛匹配，本手册不推荐将其作为系统级默认规则。

## 7. 检查 FT2232 和串口

### 7.1 USB 枚举

```bash
lsusb -d 0403:6010 -v 2>/dev/null | grep -E 'iProduct|iSerial|bInterfaceNumber'
dmesg --follow
```

重新插入 J8 时，通常会出现两个 FTDI interface。Linux 的 `ftdi_sio` 可能为
它们创建两个 `/dev/ttyUSB*`；A 通道将由 OpenOCD 从内核临时接管，B 通道保留
作串口。

### 7.2 找到调试串口

先查看稳定名称：

```bash
ls -l /dev/serial/by-id/ 2>/dev/null || true
ls -l /dev/ttyUSB* 2>/dev/null || true
```

如果有两个相似节点，逐个查询 interface 编号：

```bash
for dev in /dev/ttyUSB*; do
  [ -e "$dev" ] || continue
  echo "=== $dev ==="
  udevadm info -q property -n "$dev" \
    | grep -E 'ID_USB_INTERFACE_NUM|ID_SERIAL=|ID_VENDOR_ID|ID_MODEL_ID'
done
```

一般 B 通道的 `ID_USB_INTERFACE_NUM` 为 `01`。设备编号会随插拔和主机上其他
USB 串口变化，不要永久假定它一定是 `/dev/ttyUSB1`。

打开 115200 8N1 串口：

```bash
picocom --baud 115200 --databits 8 --parity n --stopbits 1 /dev/ttyUSB1
```

`picocom` 默认用 `Ctrl-A`、`Ctrl-X` 退出。把最后的设备名替换为实际 B 通道。

如果串口提示无权限：

```bash
sudo usermod -aG dialout "$USER"
```

注销、重新登录后再试。`plugdev` 控制原始 USB 访问，`dialout` 控制 tty 设备，
两者用途不同。

## 8. 启动 OpenOCD

保持串口终端打开，在另一个终端运行：

```bash
export HPM_SDK_BASE="$HOME/hpm_sdk"
export HPM_OPENOCD="$HOME/.local/hpm-openocd-prebuilt"

"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -s "$HPM_SDK_BASE/boards/openocd" \
  -f probes/ft2232.cfg \
  -f soc/hpm5300.cfg \
  -f boards/hpm5300evk.cfg \
  -c 'adapter speed 4000' \
  -c 'bindto 127.0.0.1'
```

HPM SDK 配置的默认速度为 10 MHz。初次连接先使用 4 MHz，稳定后可去掉速度
覆盖或改为 10 MHz。成功时应看到：

- FTDI `0403:6010` 被打开
- HPM5361 TAP ID `0x1000563d`
- target `hpm5361.cpu0`
- GDB server 监听 `127.0.0.1:3333`

也可使用 SDK 的 all-in-one 配置：

```bash
cd "$HPM_SDK_BASE/boards/openocd"

"$HPM_OPENOCD/bin/openocd" \
  -s "$HPM_OPENOCD/share/openocd/scripts" \
  -c "set HPM_SDK_BASE $HPM_SDK_BASE; set BOARD hpm5300evk; set PROBE ft2232" \
  -f hpm5300_all_in_one.cfg \
  -c 'adapter speed 4000' \
  -c 'bindto 127.0.0.1'
```

分离的三个 `-f` 参数更直观，排错时优先使用第一种写法。

## 9. 使用 GDB 调试

终端 A 保持 OpenOCD 运行，终端 B 运行 GDB：

```bash
riscv32-unknown-elf-gdb /path/to/demo.elf
```

如果尚未安装 HPMicro GNU 工具链，也可以使用第 3 节安装的 Ubuntu multiarch
GDB：

```bash
gdb-multiarch /path/to/demo.elf
```

RAM 链接程序：

```gdb
set pagination off
target extended-remote 127.0.0.1:3333
monitor reset halt
load
set $pc = _start
break main
continue
```

已经写入 Flash 的 `flash_xip` 程序：

```gdb
set pagination off
target extended-remote 127.0.0.1:3333
monitor reset halt
hbreak main
continue
```

Flash 代码使用硬件断点 `hbreak`。退出：

```gdb
detach
quit
```

Dhrystone 的完整构建、Flash 烧写和 RAM 下载流程见
[Dhrystone 教程](dhrystone.md)。

## 10. FTDI 内核驱动冲突

OpenOCD 的 MPSSE 驱动通常会自动从 `ftdi_sio` 临时解绑 A 通道，不应先卸载或
黑名单整个 `ftdi_sio` 模块，否则 B 通道调试串口也会消失。

若 OpenOCD 报 `LIBUSB_ERROR_BUSY` 或 `unable to claim interface`：

1. 退出占用 A 通道的其他 OpenOCD/IDE/串口程序。
2. 确认命令使用的是 HPM 的 `probes/ft2232.cfg`。
3. 重新拔插 J8 后重试。
4. 仍失败时，只手工解绑 A 通道，不解绑整个 USB 设备。

先找到 A 通道 sysfs 名称：

```bash
for dev in /sys/bus/usb/drivers/ftdi_sio/*:1.0; do
  [ -L "$dev" ] && basename "$dev"
done
```

假设输出为 `1-2.3:1.0`，只解绑该 interface：

```bash
echo '1-2.3:1.0' | sudo tee /sys/bus/usb/drivers/ftdi_sio/unbind
```

OpenOCD 退出后，如内核未自动恢复，可重新绑定：

```bash
echo '1-2.3:1.0' | sudo tee /sys/bus/usb/drivers/ftdi_sio/bind
```

不要原样照抄示例的 `1-2.3:1.0`，必须使用本机实际输出。不要使用会对所有 FTDI
设备执行解绑的通配脚本，因为主机上可能还有其他 USB 串口或调试器。

## 11. 在 Docker / Dev Container 中使用

udev 规则必须安装在连接 J8 的 Ubuntu 宿主机上。容器通常不运行宿主机的 udev，
所以只在容器内复制规则不能改变 USB 节点权限。最简单可靠的方式是在宿主机运行
OpenOCD 和串口终端，在容器中完成编译并运行 GDB。

如果必须在容器中运行 OpenOCD，需要映射原始 USB 总线，并允许 USB 字符设备的
major 189。对应的 Docker 参数为：

```bash
--device-cgroup-rule='c 189:* rmw' \
--mount type=bind,source=/dev/bus/usb,target=/dev/bus/usb
```

FT2232 B 通道串口还需单独传入，例如：

```bash
--device=/dev/ttyUSB1
```

设备号可能在重新插拔后改变，应先在宿主机确认实际 B 通道。对于非 root 容器
用户，还要让容器用户拥有宿主机 USB 节点对应的组权限以及串口的 `dialout` 权限。
不建议为了 USB 访问长期使用 `--privileged`。

## 12. 常见错误

### `libusb_open() failed with LIBUSB_ERROR_ACCESS`

安装第 6 节 udev 规则，加入 `plugdev`，注销后重新登录并重新插拔 J8。

### `libusb_open() failed with LIBUSB_ERROR_NOT_FOUND`

```bash
lsusb -d 0403:6010
```

无输出时检查 J8 数据线、开发板供电和 USB 口。某些 Type-C 线只能充电，不能
传输数据。

### `LIBUSB_ERROR_BUSY` 或 `unable to claim interface`

按第 10 节处理。先关闭占用进程，再只解绑 A 通道。

### `JTAG scan chain interrogation failed` 或 TAP ID 不匹配

1. 确认 JP3 至 JP7 都已安装。
2. 确认 J2 没有外置探针同时连接。
3. 降低到 `adapter speed 1000`。
4. 按 RESET 或重新上电。
5. 检查 OpenOCD 是否加载 `soc/hpm5300.cfg`。

### 串口在 OpenOCD 启动后消失

正常情况下只应接管 A 通道，B 通道应保留。检查是否执行过
`modprobe -r ftdi_sio`、全设备 unbind 或不正确的自定义 udev `RUN` 脚本。
重新插拔 J8 后按第 7 节确认 interface `01`。

### `flash driver 'hpm_xpi' not found`

误用了 Ubuntu 自带 OpenOCD：

```bash
type -a openocd
"$HPM_OPENOCD/bin/openocd" --version
```

使用本手册安装的绝对路径。

### GDB 连接后立刻复位或程序跑飞

先执行：

```gdb
monitor reset halt
```

RAM ELF 必须执行 `load`；Flash ELF 必须先用 Flash 流程烧写。不能把 RAM 链接
的 `demo.bin` 直接写到 `0x80000000` 后执行。

## 13. 参考资料

- HPMicro OpenOCD 发布页: <https://github.com/hpmicro/riscv-openocd/releases>
- HPM SDK: <https://github.com/hpmicro/hpm_sdk>
- HPM SDK 调试快速指南: <https://hpm-sdk.readthedocs.io/en/latest/get_started.html>
- HPM5300EVK RevC 原理图: <https://www.hpmicro.com/Public/Uploads/uploadfile/files/20240620/HPM5300EVKREVC.pdf>
