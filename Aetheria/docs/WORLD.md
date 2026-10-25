# WORLD.md — Island Layout, Terrain, Save Format

Aligned with `AETHERIA_MASTER_PLAN.md` v4.

## World Layout

One compact, continuous island. No sky islands. A sprint across takes roughly 90 seconds. Everything is open from minute one. Every region and main route works for every family, through different physics paths where needed.

### Four Regions

| Region (display name) | Built Biome | Role |
| --- | --- | --- |
| Verdant Refuge | Lush Plains | Friendly hub, home landmark, crafting, storage, comfort |
| Wildwood | Mystic Grove | Gathering, gentle wildlife, sheltered routes, soil |
| Waterworn Basin | Frostpeak Taiga | Snowmelt streams, ponds, ditches, diving, water/digging |
| Windcarved Heights | Sunstone Dunes | Hot sand thermals, gliding, wind, sand traction, momentum |

Each region: one authored landmark, one shortcut, one safe resting point. Supporting content is procedural.

### Terrain

Chunked heightfield rendered as flat-shaded low-poly geometry with baked vertex ambient occlusion.

Under the terrain sits a flat integer grid of 1 m cells storing:
- Soil moisture
- Crop stage
- Trench depth
- Water level

**Ditches:** digging lowers trench depth (0.3 m). Does not rebuild terrain collider.

### Water

Water level per grid cell moves downhill (~4 flow steps/s). Active radius ~24 m at full detail; distant basins keep one summary value.

**Demo:** one reservoir, one authored trench path.

### Void / Respawn

- No death, no damage, no punishment.
- Respawn: 0.5 s fade to last safe ground, no inventory loss.

---

## Coordinate System

| Axis | Direction |
| --- | --- |
| X | East-West |
| Y | Up (positive up) |
| Z | North-South |

Units: metres and seconds.

---

## Save Format

### Design Principles

- Local-first, multiple named worlds, no account.
- Browser storage (fast path) + IndexedDB mirror.
- Three rolling backups (`backup_1` to `backup_3`), rotate only when content changed.
- Periodic writes + on page hide.
- Browser storage can be evicted — say so plainly and remind players to export.

### Export & Import

- Copy/paste JSON text in Settings (file download only where host allows).
- **Staged import:** parse → check version → validate each key as valid JSON with expected fields → show summary (version, date, world count) → write current save into `backup_1` first → apply → reload. If any step fails, change nothing and say why.
- Never silently overwrites.

### Schema

- Versioned with validated migrations.
- Destructive actions (reset, delete world) require explicit confirmation.
- No optional browser permissions.
- Diagnostics opt-in only; feedback report is copy-and-send text the player controls.

### Save Data Structure

```json
{
  "version": 1,
  "timestamp": 1234567890,
  "worlds": {
    "world-name": {
      "seed": 42,
      "entities": [],
      "grid": {},
      "pieces": [],
      "inventory": {},
      "discoveries": []
    }
  },
  "profile": {
    "name": "Slimey",
    "activeFamily": 0,
    "lastFormPerFamily": [0, 0, 0],
    "settings": {}
  }
}
```

### Save Timing

- Auto-save on significant events and periodically.
- Flush on `pagehide` / `beforeunload`.
- Load on game start.

---

## Form Switching

- Instant and safe.
- If new shape doesn't fit, switch refused with outline flash, no teleporting.
- Speed kept across switch.

---

## Numbers Summary

| Metric | Value |
| --- | --- |
| Sprint crossing | ~90 s |
| Terrain grid | 1 m cells |
| Trench depth | 0.3 m |
| Water flow steps | ~4/s |
| Water active radius | ~24 m |
| Day/night cycle | 24 min |
| Offline farming cap | 72 h |
| Respawn time | 0.5 s fade |
| Backup count | 3 rolling |
