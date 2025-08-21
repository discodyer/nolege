---
tags:
  - ROS2-humble
  - microROS
  - DDS
  - XRCE-DDS
  - Zephyr
  - STM32
  - embedded
---

# Micro-XRCE-DDS 相关细节和 ROS2 集成

## 系统架构

[![](https://mermaid.ink/img/pako:eNpdkk9PwjAYh79K854HbmOb22JMYANP_glgYtg4LKyORbaRuiUikBijEo3Gm4legJOeOJoYTfwygPgt7MbQxJ7a93n6_tqmXWgENgYVHGK1m6hQNX1ER96YfozmF8PZ48va_Pp5Mb6lszrKZDZRwajhdrNDULm6W6kv9UJCNGPbbZAgc1DWihldryCt5WI_TB0tdnr7-XJ1bV_f6yH9v513_mQ9keejwWxwRdns7n4xmfRQ0SjvVhCP4tJwmLrFJLyUoh16nRSUErBlzC5fp-8PCV7cnH-dv6V8a7lxlbgRR9LO32dP088xDVudOwZIB4a-kWuDGpIIM-Bh4lnxErqxZ0LYxB42QaVT2yJHJjDLesvqBFG4Ag6hjun3abe25deCwFs1JEHkNEE9tFrHdBW1bSvEuks3WN5vlWDfxkQLIj8ElROkpAmoXTgBNafksjLHsZIoredkXuYY6IAqSllB4XKiKCuiokisIvQZOE1i2azMsyyniCLLy4IgrysMYNsNA7K9_BLJz-j_AG0mr9g?type=png)](https://mermaid.live/edit#pako:eNpdkk9PwjAYh79K854HbmOb22JMYANP_glgYtg4LKyORbaRuiUikBijEo3Gm4legJOeOJoYTfwygPgt7MbQxJ7a93n6_tqmXWgENgYVHGK1m6hQNX1ER96YfozmF8PZ48va_Pp5Mb6lszrKZDZRwajhdrNDULm6W6kv9UJCNGPbbZAgc1DWihldryCt5WI_TB0tdnr7-XJ1bV_f6yH9v513_mQ9keejwWxwRdns7n4xmfRQ0SjvVhCP4tJwmLrFJLyUoh16nRSUErBlzC5fp-8PCV7cnH-dv6V8a7lxlbgRR9LO32dP088xDVudOwZIB4a-kWuDGpIIM-Bh4lnxErqxZ0LYxB42QaVT2yJHJjDLesvqBFG4Ag6hjun3abe25deCwFs1JEHkNEE9tFrHdBW1bSvEuks3WN5vlWDfxkQLIj8ElROkpAmoXTgBNafksjLHsZIoredkXuYY6IAqSllB4XKiKCuiokisIvQZOE1i2azMsyyniCLLy4IgrysMYNsNA7K9_BLJz-j_AG0mr9g)

### 核心组件说明：
1. **Zephyr RTOS**：资源受限设备的实时操作系统
2. **Micro-XRCE-DDS Client**：
   - 运行在嵌入式设备上的轻量级库
   - 实现DDS协议的核心子集
   - 资源要求低（RAM < 10KB）

3. **Micro-XRCE-DDS Agent**：
   - 运行在Linux/Windows主机上
   - 作为Client与DDS网络之间的桥梁
   - 实现完整DDS功能

4. **ROS 2 DDS中间件**：
   - 使用Fast DDS/Cyclone DDS等实现
   - 提供分布式通信能力

## Agent与Client关系详解

### 区别对比
| **特性** | **Client** | **Agent** |
|----------|------------|-----------|
| **定位** | DDS协议轻量化子集 | 完整DDS代理 |
| **运行环境** | 嵌入式设备（MCU） | Linux/Windows主机 |
| **资源需求** | RAM: <10KB | RAM: >10MB |
| **功能范围** | 序列化/反序列化 | DDS域管理、QoS策略、类型发现 |
| **连接方式** | UART/UDP/TCP | 监听Client连接，连接DDS域 |

### 协作流程

[![](https://mermaid.ink/img/pako:eNp1kt1r01AYxv-V8l4pZG0-mppzLgajvRXHPm4kN4fmmAWbpJ6dgLMUdLKt4LYiww8QtiEIglIVQUp1-s_0xPhf-DaHVsUtF-G8T57n9xzI24N2GnCgsM3vZTxp81bEQsFiP6ng02VCRu2oyxJZaXYinsj_9ZXwUrnVWteifuv00vJyaacV9XXy892T6bfz4vuJ-rRb_DjNj99c21xZ26httlZrG83V6zpY-jGHPEwNXmEQj-rsTA13p-Pj4uHeFQWlVQ2fqvFjNNWK0etfL_cW9n-w-ee3av9whh2dTi9OrgBOhmrwQh0-z78M8kcf8mcf86PRJbDi4j22TseT_PxAHeyjpgPaiuPSH-barfWKrW_2t0nz0KbvgN3Do0W95vsJGBCKKAAqRcYNiLmI2WyE3gzig9ziMfeB4jFg4q4PhtY7bCfN5PxDKNDjJ32k4W-7nabxHCjSLNwCeod1tnHKugGT8-VYqIInARfNNEskUMs1SwjQHtwH6hCn6lmW2XAbNxzP9iwDdoC6jWqdWI7resQlpGGSet-AB2WtWfVs07SIa9eJ7RGHYIIHkUzFTb2i5ab2fwOaWwsd?type=png)](https://mermaid.live/edit#pako:eNp1kt1r01AYxv-V8l4pZG0-mppzLgajvRXHPm4kN4fmmAWbpJ6dgLMUdLKt4LYiww8QtiEIglIVQUp1-s_0xPhf-DaHVsUtF-G8T57n9xzI24N2GnCgsM3vZTxp81bEQsFiP6ng02VCRu2oyxJZaXYinsj_9ZXwUrnVWteifuv00vJyaacV9XXy892T6bfz4vuJ-rRb_DjNj99c21xZ26httlZrG83V6zpY-jGHPEwNXmEQj-rsTA13p-Pj4uHeFQWlVQ2fqvFjNNWK0etfL_cW9n-w-ee3av9whh2dTi9OrgBOhmrwQh0-z78M8kcf8mcf86PRJbDi4j22TseT_PxAHeyjpgPaiuPSH-barfWKrW_2t0nz0KbvgN3Do0W95vsJGBCKKAAqRcYNiLmI2WyE3gzig9ziMfeB4jFg4q4PhtY7bCfN5PxDKNDjJ32k4W-7nabxHCjSLNwCeod1tnHKugGT8-VYqIInARfNNEskUMs1SwjQHtwH6hCn6lmW2XAbNxzP9iwDdoC6jWqdWI7resQlpGGSet-AB2WtWfVs07SIa9eJ7RGHYIIHkUzFTb2i5ab2fwOaWwsd)

## DDS与ROS2之间的类型转换

### 话题名称转换机制

**ROS2话题名称 → DDS主题名称**：

```
ROS2话题：/sensor/temperature
DDS主题：rt/sensor/temperature
```

转换规则：
1. 添加前缀 `rt/`

在Micro-XRCE-DDS Client中的实现：
```c
#define ROS_DDS_TOPIC_NAME(topic) "rt" topic
```

该约定在[官方 ROS 2 设计文档](https://design.ros2.org/articles/topic_and_service_names.html)中有完整记录。

| ROS Subsystem         |	Prefix  |
| --------------------- | --------- |
| ROS Topics            | 	rt      |
| ROS Service Request   |	rq      |
| ROS Service Response  |	rr      |
| ROS Service           |	rs      |
| ROS Parameter         |	rp      |
| ROS Action            |	ra      |

下面是官方给出的一些示例

| ROS Name                          | DDS Topic     |
| --------------------------------- | ------------- |
| `/foo`                            | `rt/foo`      |
| `rostopic:///foo/bar`             | `rt/foo/bar`  |
| `/robot1/camera_left/image_raw`   | `rt/robot1/camera_left/image_raw` |

### 数据类型转换机制

**ROS2数据类型 ➔ DDS类型**

以 `std_msgs/msg/String` 为例：

```
ROS2消息类型：std_msgs/String
DDS类型：std_msgs::msg::dds_::String_
```

在`std_msgs`和`String`之间插入`::msg::dds_::`，并在末尾添加`_`

如果是service类型，中间就换成插入`::srv::dds_::`，并在末尾添加`_`

### 自定义消息转换流程

[![](https://mermaid.ink/img/pako:eNo9kcFKw0AQhl8lzDkNSbaJyR4Em_QgWITqQUx6WJo1DTZJ2SZgLT14EBXE9iCCXhRKQRD0pKD1cZr0NdwmrXvame_bfwdmCO3Yo4DBZ6TXEQ5tNxL42XGa-weCKkhh388frhbzr5ZQqWwLNWfX3lveP-fXk-zxtVXKtQJZjhR43fxulo2n2fvT4vtmja0C204jaLNYOGpa9YptHyzm0-XLRRm1Fu1CrDvZ5212Oct-x8u3Dyv_mawHKCUQ-aiBBzhhKRUhpCwkqxKGK-5C0qEhdQHzq0fYqQti2e-SQZwmG-Az7rjRiKf1SHQcx-EmkMWp3wF8Qrp9XqU9jyTUDvgDEv53GY08yqw4jRLAqqoWIYCHcAYYmUgyFEXWNX0LGaqhiDAArOlS1VSQphmmZpq6bFZHIpwX38qSocqyYmoImVxBChKBekESs0a5mWJBoz9dYpOA?type=png)](https://mermaid.live/edit#pako:eNo9kcFKw0AQhl8lzDkNSbaJyR4Em_QgWITqQUx6WJo1DTZJ2SZgLT14EBXE9iCCXhRKQRD0pKD1cZr0NdwmrXvame_bfwdmCO3Yo4DBZ6TXEQ5tNxL42XGa-weCKkhh388frhbzr5ZQqWwLNWfX3lveP-fXk-zxtVXKtQJZjhR43fxulo2n2fvT4vtmja0C204jaLNYOGpa9YptHyzm0-XLRRm1Fu1CrDvZ5212Oct-x8u3Dyv_mawHKCUQ-aiBBzhhKRUhpCwkqxKGK-5C0qEhdQHzq0fYqQti2e-SQZwmG-Az7rjRiKf1SHQcx-EmkMWp3wF8Qrp9XqU9jyTUDvgDEv53GY08yqw4jRLAqqoWIYCHcAYYmUgyFEXWNX0LGaqhiDAArOlS1VSQphmmZpq6bFZHIpwX38qSocqyYmoImVxBChKBekESs0a5mWJBoz9dYpOA)

[Python转换脚本](https://github.com/discodyer/miracz7/blob/dds/modules/libmicroxrcedds/generate_dds_messages.py)

[![](https://mermaid.ink/img/pako:eNp9lG1r01AUx79KuHub1jw0aRJk0CZNV3AImy_EdoyY3LZhSW-4uWXrxl4MN6wvhIFTYQ6nTmGgdoIyZWV-mibpxzBN0lofWF6EnHP-v_85J3DvDjCRBYECWtjw2tS9cqNDxU-pvnJ3leKo5dVq-OLxaHi5RuVyi1Q5TYev94PhVfR1GA1Pbz_Eixj5tuWst2AHYoPAdbtDIG4aJvTXUrtyQqv16Og07B_WtDuZaVpVk6pWH-8fhyefxj-fBQcflPCyH-5dBP2X47fnqXrSyTPMDaMFb7l-a530PJg5aIlDpR4MjkfXT2f-EyI4OU9mDgZPxmcH0atBcP189ONzBlYSUK-PvzyKjs5d28RoC5vQsvx4mUyjJ5pqNrwavP-WuufbfwiWpoLw6jATmJmgmghq9eWJP3V_Ra3kNG01GLwL-9-jjxej4Vn0Zi_TLqXaNEjfpmP4vgabVPyfqabtOMqCXijwvEj7BKMNqCxoPKdzOm0iB2Fls20T-Bfpm9j2SAZzrCzq_Axm5aKocTfABCEnQwtqSReYGcpLUoVXb0BRl3jdaV9Z5Yrl33CxzOql__Sds6BKdJlWJ3vPJzW6ki00n9WTOeczVXqJrmUjzFv7pOdAqkSlg-Q2bYu0Fc7bmq_W_qkCOj4jtgUUgruQBi7ErjEJwc6EawDShi5sACX-tAy80QB0mneMXjzCtNDCsabR2Y3dPKPzACF3aohRt9UGStNw_DjqelZ8kjQ7Bgx3lsWwY0Gsom6HAIUTCokJUHbAFlB4mc9LLMuIgljkJU5iadADiiDmCzLLC4IkC7IsMnJhlwbbSVsmL3EMw8oCz3JMsSjLAg2gZROEl9MrIbkZdn8BKX569A?type=png)](https://mermaid.live/edit#pako:eNp9lG1r01AUx79KuHub1jw0aRJk0CZNV3AImy_EdoyY3LZhSW-4uWXrxl4MN6wvhIFTYQ6nTmGgdoIyZWV-mibpxzBN0lofWF6EnHP-v_85J3DvDjCRBYECWtjw2tS9cqNDxU-pvnJ3leKo5dVq-OLxaHi5RuVyi1Q5TYev94PhVfR1GA1Pbz_Eixj5tuWst2AHYoPAdbtDIG4aJvTXUrtyQqv16Og07B_WtDuZaVpVk6pWH-8fhyefxj-fBQcflPCyH-5dBP2X47fnqXrSyTPMDaMFb7l-a530PJg5aIlDpR4MjkfXT2f-EyI4OU9mDgZPxmcH0atBcP189ONzBlYSUK-PvzyKjs5d28RoC5vQsvx4mUyjJ5pqNrwavP-WuufbfwiWpoLw6jATmJmgmghq9eWJP3V_Ra3kNG01GLwL-9-jjxej4Vn0Zi_TLqXaNEjfpmP4vgabVPyfqabtOMqCXijwvEj7BKMNqCxoPKdzOm0iB2Fls20T-Bfpm9j2SAZzrCzq_Axm5aKocTfABCEnQwtqSReYGcpLUoVXb0BRl3jdaV9Z5Yrl33CxzOql__Sds6BKdJlWJ3vPJzW6ki00n9WTOeczVXqJrmUjzFv7pOdAqkSlg-Q2bYu0Fc7bmq_W_qkCOj4jtgUUgruQBi7ErjEJwc6EawDShi5sACX-tAy80QB0mneMXjzCtNDCsabR2Y3dPKPzACF3aohRt9UGStNw_DjqelZ8kjQ7Bgx3lsWwY0Gsom6HAIUTCokJUHbAFlB4mc9LLMuIgljkJU5iadADiiDmCzLLC4IkC7IsMnJhlwbbSVsmL3EMw8oCz3JMsSjLAg2gZROEl9MrIbkZdn8BKX569A)

## Zephyr集成实践

[Github | discodyer/miracz7](https://github.com/discodyer/miracz7/tree/dds/modules/libmicroxrcedds)

参考代码仓：

- [Github | micro-ROS/micro_ros_setup](https://github.com/micro-ROS/micro_ros_setup/)
- [Github | Micro-XRCE-DDS-Apps/Zephyr](https://github.com/eProsima/Micro-XRCE-DDS-Apps/tree/microxrce_dev/Zephyr)
- [Github | micro-ROS/micro_ros_zephyr_module](https://github.com/micro-ROS/micro_ros_zephyr_module/)
- [Github | PX4 - uxrce_dds_client](https://github.com/PX4/PX4-Autopilot/tree/main/src/modules/uxrce_dds_client)
- [Github | ArduPilot - AP_DDS](https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_DDS)
- [Github | yashi/micro-xrce-dds-client](https://github.com/yashi/micro-xrce-dds-client/)

## 调试命令

1. **启动Agent**：
   - 启动Agent并以串口方式连接：
   ```
   MicroXRCEAgent serial --dev /dev/ttyACM1 -b 115200 -v6 -d
   ```

2. **查看话题**：
   - `ros2 topic list`
   - `ros2 topic info /HelloWorldTopic --verbose`
    ```
    Type: std_msgs/msg/String

    Publisher count: 1

    Node name: _CREATED_BY_BARE_DDS_APP_
    Node namespace: _CREATED_BY_BARE_DDS_APP_
    Topic type: std_msgs/msg/String
    Endpoint type: PUBLISHER
    GID: 01.0f.df.04.c0.0d.11.cb.00.00.00.00.00.00.01.03.00.00.00.00.00.00.00.00
    QoS profile:
    Reliability: RELIABLE
    History (Depth): UNKNOWN
    Durability: VOLATILE
    Lifespan: Infinite
    Deadline: Infinite
    Liveliness: AUTOMATIC
    Liveliness lease duration: Infinite

    Subscription count: 0
    ```
    - `ros2 topic echo /HelloWorldTopic`
    ```
    data: 'Hello from Zephyr! Count: 119'
    ---
    ```

## 相关资料

- [Github | ArduPilot - Testing with DDS/micro-Ros](https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_DDS/README.md)
- [PX4 Guide | uXRCE-DDS (PX4-ROS 2/DDS Bridge) ](https://docs.px4.io/main/en/middleware/uxrce_dds.html#humble)
- [Github | micro-ROS/micro_ros_setup](https://github.com/micro-ROS/micro_ros_setup/)
- [Github | Micro-XRCE-DDS-Apps/Zephyr](https://github.com/eProsima/Micro-XRCE-DDS-Apps/tree/microxrce_dev/Zephyr)
- [Github | micro-ROS/micro_ros_zephyr_module](https://github.com/micro-ROS/micro_ros_zephyr_module/)
- [Github | PX4 - uxrce_dds_client](https://github.com/PX4/PX4-Autopilot/tree/main/src/modules/uxrce_dds_client)
- [Github | ArduPilot - AP_DDS](https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_DDS)
- [Github | yashi/micro-xrce-dds-client](https://github.com/yashi/micro-xrce-dds-client/)
- [microROS | First micro-ROS Application on Zephyr](https://micro.ros.org/docs/tutorials/core/first_application_rtos/zephyr/)
- [Micro-XRCE-DDS-Client | Documentation](https://micro-xrce-dds.docs.eprosima.com/en/latest/)
- [Zephyr | Modules (External projects)](https://docs.zephyrproject.org/latest/develop/modules.html)
- [Zephyr | West Manifests - Git Submodules in Projects](https://docs.zephyrproject.org/latest/develop/west/manifest.html#git-submodules-in-projects)
- [知乎 | ROS2设计文章系列之十九 —— 话题和服务名称到DDS的映射](https://zhuanlan.zhihu.com/p/463769752)
- [ROS2 Design | Topic and Service name mapping to DDS](https://design.ros2.org/articles/topic_and_service_names.html)
- [Safe DDS | Type Name convention between DDS types and ROS 2 types](https://safe-dds.docs.eprosima.com/main/intro/getting_started_ros2.html#type-name)
- [ROS2 | QoS profiles](https://docs.ros.org/en/rolling/Concepts/Intermediate/About-Quality-of-Service-Settings.html#qos-profiles)
- [ROS2 | Different ROS 2 middleware vendors](https://docs.ros.org/en/humble/Concepts/Intermediate/About-Different-Middleware-Vendors.html)
