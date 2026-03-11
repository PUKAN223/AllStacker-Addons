import { Entity, InputPermissionCategory, Player, system } from "@minecraft/server";
import type { IPlayerState } from "../types/IPlayerState.ts";
import { CameraState } from "../types/CameraState.ts";

let PlayerFishingStateInstance: PlayerFishingState | null = null;

class PlayerFishingState {
    private playerStates: Map<string, IPlayerState> = new Map();
    private playerDataAnimationIndex: Map<string, number> = new Map();
    private playerDataAnimationTick: Map<string, number> = new Map();
    private playerDataAnimationControllerIndex: Map<string, number> = new Map();
    private playerDataAnimationControllerTick: Map<string, number> = new Map();
    private playerDataPrevStopExpression: Map<string, string> = new Map();

    private constructor() {

    }

    static initialize() {
        if (!PlayerFishingStateInstance) {
            PlayerFishingStateInstance = new PlayerFishingState();
        }
        return PlayerFishingStateInstance;
    }

    public setState(player: Player, state: Partial<IPlayerState>) {
        this.playerStates.set(player.id, {
            ...this.getOrCreateState(player),
            ...state
        });
    }

    public getOrCreateState(player: Player): IPlayerState {
        if (!this.playerStates.has(player.id)) {
            this.playerStates.set(player.id, {
                rodStartTick: 0,
                isCasted: false,
                reelActive: false,
                reelStartTick: 0,
                reelAmount: 0,
                completedReelParts: 0,
                lineDurability: 100,
                hasFishPulling: false,
                fishWillPullTick: 0,
                fishEscapeTick: 0,
                reelStuckAddPlayedTick: 0,
                reelInAddPlayedTick: 0
            });
        }
        return this.playerStates.get(player.id)!;
    }

    public resetState(player: Player, oldData: Partial<IPlayerState> ) {
        this.playerStates.delete(player.id);
        this.getOrCreateState(player);
        this.setState(player, oldData);
    }

    public resetPlayerAnimations(pl: Player, controller: string) {
        if (pl && pl.isValid && controller) {
            system.run(() => {
                pl.playAnimation("animation.empty_mnp_ci.mnp_ci", {
                    controller: controller
                });
            });
        }
    }

    public handlePlayerVariables(player: Player, state: IPlayerState) {
        const headLoc = player.getHeadLocation();
        const viewDir = player.getViewDirection();

        let lx = 0, ly = 0, lz = 0;
        let lvx = 0, lvy = 0, lvz = 0;
        const isStuck = 0;
        const hasFish = 0;

        if (state.hookEntity && state.hookEntity.isValid) {
            const loc = state.hookEntity.location;
            const vel = state.hookEntity.getVelocity();
            lx = loc.x; ly = loc.y + 0.45; lz = loc.z;
            lvx = vel.x; lvy = vel.y; lvz = vel.z;
        }

        const castedRot = state.castedRotation || viewDir;

        const f = (n: number) => n.toFixed(3);
        const vP_h = `v.__p_h.x=${f(headLoc.x)};v.__p_h.y=${f(headLoc.y)};v.__p_h.z=${f(headLoc.z)};`;
        const vP_h_r = `v.__p_h_r.x=${f(viewDir.x)};v.__p_h_r.y=${f(viewDir.y)};v.__p_h_r.z=${f(viewDir.z)};`;
        const vC_p_h_r = `v.__c_p_h_r.x=${f(castedRot.x)};v.__c_p_h_r.y=${f(castedRot.y)};v.__c_p_h_r.z=${f(castedRot.z)};`;
        const vL = `v.__l.x=${f(lx)};v.__l.y=${f(ly)};v.__l.z=${f(lz)};`;
        const vL_v = `v.__l_v.x=${f(lvx)};v.__l_v.y=${f(lvy)};v.__l_v.z=${f(lvz)};`;

        const isCasted = state.isCasted ? 1 : 0;
        const isReeling = state.reelActive ? 1 : 0;
        const flags = `v.__l_s=${isStuck};v.__l_f=${hasFish};v.__is_c=${isCasted};v.__is_r=${isReeling};v.__is_fp=0;v.__is_fw=0;v.__is_fh=0;`;

        const expression = `${vP_h}${vP_h_r}${vC_p_h_r}${vL}${vL_v}${flags}v.__t=${system.currentTick}; q.all_animations_finished;`;

        if (this.playerDataPrevStopExpression.get(player.id) === expression) return;
        this.playerDataPrevStopExpression.set(player.id, expression);

        let animTick = this.playerDataAnimationTick.get(player.id) || 0;
        let animIndex = this.playerDataAnimationIndex.get(player.id) || 0;
        const ctrlIndex = this.playerDataAnimationControllerIndex.get(player.id) || 0;

        animTick++;
        if (animTick >= 100) { animTick = 0; animIndex = (animIndex + 1) % 20; }

        this.playerDataAnimationTick.set(player.id, animTick);
        this.playerDataAnimationIndex.set(player.id, animIndex);

        try {
            player.playAnimation(`animation.player_mnp_ci.mnp_ci.data_transfer_${animIndex}`, {
                controller: `controller.animation.data_transfer_${ctrlIndex}`,
                stopExpression: expression,
                blendOutTime: 0
            });
        } catch (_e) { "" }
    }

    public setCamera(pl: Player, cameraState: CameraState, hook?: Entity) {
        if (cameraState === CameraState.Start && hook) {
            pl.camera.setCamera(
                "mnp_ci:custom_follow_orbit_left"
            )
            pl.inputPermissions.setPermissionCategory(
                InputPermissionCategory.Movement,
                false
            )
        } else {
            pl.camera.clear()
            pl.inputPermissions.setPermissionCategory(
                InputPermissionCategory.Movement,
                true
            )
        }
    }
}

export { PlayerFishingState }