/* @ Beta @ */
let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { ChatUtils, Rotations, MovementHelper, TimeHelper, ItemUtils, RaytraceUtils, MathUtils } = global.export

class ScathaMacro {
    constructor() {
        this.ModuleName = "Scatha Macro"
        this.enabled = false
        getKeyBind("Scatha Macro", "Polar Client - Combat", this)

        this.STATES = {
            SETUP: 0,
            MINING: 1,
            ROUTING: 2,
            KILLING: 3,
        }

        this.state = this.STATES.SETUP
        this.direction = 0

        register("step", () => {
            if (!this.enabled) return

            switch (this.state) {
                case this.STATES.SETUP:
                    MovementHelper.stopMovement()

                    this.direction = Rotations.getRoundedYaw()
                    Rotations.rotateToAngles(this.direction, 45.0)
                    Rotations.onEndRotation(() => {
                        this.state = this.STATES.MINING
                    })

                    break
                case this.STATES.MINING:
                    MovementHelper.stopMovement()
                    MovementHelper.setKey("leftclick", true)
                    MovementHelper.setKey("w", true)

                    break
            }
        }).setFps(8)

        register("packetSent", (packet, event) => {
            const pos = new BlockPos(packet.func_179715_a())
            if (this.enabled && Math.floor(Player.getY() - 1) === pos.y) cancel(event)
        }).setFilteredClass(net.minecraft.network.play.client.C07PacketPlayerDigging)
    }

    toggle() {
        this.enabled = !this.enabled
        if (this.enabled) {
            this.sendMacroMessage("&aEnabled")
            this.state = this.STATES.SETUP
        } else {
            this.stopMacro()
        }
    }

    sendMacroMessage(msg) {
        ChatUtils.sendModMessage(this.ModuleName + ": " + msg)
    }

    stopMacro(msg=null) {
        if(msg) this.sendMacroMessage(msg)
        this.sendMacroMessage("&cDisabled")
        this.enabled = false
        Rotations.stopRotate()
        MovementHelper.setKey("leftclick", false)
        MovementHelper.stopMovement()
    }
}

new ScathaMacro()