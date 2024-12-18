let { TeleportFailsafe, MiningBot, PowderRotations, Failsafe, TimeHelper } = global.export
let { ModuleManager } = global.settingSelection

// 🐎
class SmartFailsafe extends Failsafe {
    constructor() {
        super()

        this.THRESHOLD = 0.15
        register("step", () => {
            switch (ModuleManager.getSetting("Auto Vegetable", "Failsafe Sensitivity")) {
                case "Relaxed":
                    this.THRESHOLD = 0.15
                    break
                case "Normal":
                    this.THRESHOLD = 0.2
                    break
                case "High":
                    this.THRESHOLD = 0.25
                    break
                case "Strict":
                    this.THRESHOLD = 0.3
                    break
            }
        }).setDelay(1)

        this.blocksBroken = 0
        this.averageBps = 0
        this.bpsArray = []

        this.recentlyBroken = []
        this.breakTimer = new TimeHelper()

        this.triggers = [
            register("step", () => {
                if (!this.toggle || (!MiningBot.Enabled && !PowderRotations.rotate) || Client.isInChat()) return
                this.bpsArray.push(this.blocksBroken)
                this.blocksBroken = 0

                if (this.bpsArray.length > 120) this.bpsArray.shift()
                this.averageBps = Math.min(4 * this.bpsArray.reduce((a, b) => a + b, 0) / this.bpsArray.length, 20) // Cap at 20

                //ChatLib.chat(`[SmartFailsafe] Average BPS: ${this.averageBps} | Delay: ${1000 / (this.averageBps * this.THRESHOLD)}`)
                if (this.averageBps && this.breakTimer.hasReached(1000 / (this.averageBps * this.THRESHOLD))) this.triggered = true
                else this.triggered = false
            }).setFps(4),

            register("packetReceived", (packet) => {
                if (packet.func_148846_g() != 10) return // Not fully broken
                if (this.recentlyBroken.includes(packet.func_179821_b().toString())) return // Already broken

                this.recentlyBroken.push(packet.func_179821_b().toString())
                if (this.recentlyBroken.length > 10) this.recentlyBroken.shift()

                this.blocksBroken++
                this.breakTimer.reset()
            }).setFilteredClass(net.minecraft.network.play.server.S25PacketBlockBreakAnim.class), // Reset BPS on block break animation

            register("tick", () => {
                if (!this.toggle) return

                if (this.triggered && this.breakTimer.hasReached(1500 / (this.averageBps * this.THRESHOLD))) {
                    global.export.FailsafeManager.trigger("Smart")
                    this.triggered = false
                }

                if ((!MiningBot.Enabled && !PowderRotations.rotate) || TeleportFailsafe.isTeleporting() || Client.isInChat()) {
                    this.triggered = false
                    this.breakTimer.reset()
                    this.bpsArray = []
                }
            })
        ]
    }
}

global.export.SmartFailsafe = new SmartFailsafe()