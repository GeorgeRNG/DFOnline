import chestMenu from "../chestMenu";
import { ArgumentBlock, Item, NumberVal, SCOPE_TO_NAME_MAP, Text, Variable, VarScope, Location, Vector, Potion, Sound, GameValue, ChestItem as MinecraftItem, BlockTag, GvalSelection, SELECTION_VALUES, ParsedItem, Particle, ScopeName, UndefinedItem, DefinedItems, VarScopeEnum, Component, Parameter } from "../../../template";
import ContextMenu from "../../../../main/context";
import ActDB, { ItemTypeColors, ItemTypeNames, ParameterTypes } from "../../../ts/actiondump";
import { code, findBlockTag, findBlockTagOption, names } from "../../edit";
import { minecraftColorHTML, mcTextCompToCodes, stripColors } from "../../../../main/main";
import { parse } from 'nbt-ts';
import type { Icon, ParameterTypesType as ParameterTypeType, Tag } from "../../../ts/actiondump";
import { VarScopeColor } from '../../../template';
import SelectionContext from "../../../../main/SelectionContext";

export default abstract class ChestItem<ItemType extends Item> {
    backgroundUrl: string = "";

    abstract movable: boolean;

    constructor(public item: ItemType) { }

    contextMenu(Block: number, Slot: number, name: string = this.item.id, values: HTMLElement[] = []): ContextMenu {
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = () => {
            const block = code.blocks[Block] as ArgumentBlock;
            const index = block.args.items.findIndex(slot => slot.slot === Slot);
            block.args.items.splice(index, 1);
            chestMenu(Block);
            ctxBox.close();
        }
        const ctxBox = new ContextMenu(name, [...values, deleteButton]);

        return ctxBox;
    }

    /**
     * Get the representation of the item as a HTML element.
     */
    icon(backgroundUrl = this.backgroundUrl): HTMLDivElement | HTMLImageElement {
        const itemElement = document.createElement('img');
        itemElement.src = backgroundUrl;
        return itemElement;
    };

    /**
     * A HTML div with all the tooltip information.
     */
    abstract tooltip(): HTMLDivElement;

    /**
     * Returns the data in the item as a human readable string.
     */
    abstract repr(): string;

    /**
     * Dynamically get the item based of it's type.
     * @param item The item to parse.
     * @returns Any type of item, matching the type of the item.
     */
    static getItem(item: Item) {
        return getItem(item);
    }
}
abstract class NamedItem extends ChestItem<Text | NumberVal | Variable | Component | Parameter> {

    contextMenu(Block: number, Slot: number, name: string, values: HTMLElement[] = []): ContextMenu {
        const value = document.createElement('input');
        value.value = this.item.data.name;

        value.onclick = e => e.stopPropagation();
        value.onkeydown = e => {
            if (e.key === 'Enter' || e.key === 'Tab') {
                this.item.data.name = value.value;
                if (e.key === 'Enter') {
                    ctxBox.close();
                }
            }
            if (e.key === 'Escape') {
                if (value.value !== this.item.data.name) {
                    value.value = this.item.data.name;
                    value.select();
                }
                else ctxBox.close();
            }
        }

        const ctxBox = super.contextMenu(Block, Slot, name, [value, ...values]);
        return ctxBox;
    }
}

export class UnknownItem extends ChestItem<UndefinedItem> {
    backgroundUrl = 'https://dfonline.dev/public/images/BARRIER.png';

    movable = false;

    constructor(item: Item) { super(item); }

    contextMenu(_: number, __: number): ContextMenu {
        return new ContextMenu(`%${this.item.id}%`, [], true);
    }

    icon() {
        const itemElement = document.createElement('div');

        itemElement.style.backgroundImage = `url(${this.backgroundUrl})`;
        itemElement.classList.add('fadepulse');

        return itemElement;
    }

    tooltip() {
        const tooltip = document.createElement('div');
        tooltip.innerText = `This item couldn't be parsed.`;
        tooltip.style.color = '#ff0000';
        return tooltip;
    }

    repr(): string {
        return `%${this.item}%`;
    }
}

/**
 * Utility for tooltips
 * @deprecated never used.
 */
// function makeTooltip(data: { value: string, color?: string, label?: string }[]): HTMLDivElement {
//     const tooltip = document.createElement('div');
//     data.forEach(value => {
//         const label = document.createElement('label');
//         label.innerText = value.label ? value.label + ' ' : '';
//         const text = document.createElement('span');
//         text.innerText = value.value;
//         text.style.color = value.color ? value.color : 'white'
//     })
//     return tooltip;
// }

export class Num extends NamedItem {
    backgroundUrl = 'https://dfonline.dev/public/images/SLIME_BALL.png';
    declare item: NumberVal;

    movable = true;

    constructor(item: NumberVal) {
        super(item);
    }

    icon() {
        const itemElement = document.createElement('div');

        itemElement.style.backgroundImage = `url(${this.backgroundUrl})`;
        const count = document.createElement('span');
        count.innerText = this.item.data.name;
        count.style.color = "rgb(255, 85, 85)";
        itemElement.append(count);

        // // when the user uses the scroll wheel
        // itemElement.onwheel = e => {
        //     const count = parseInt(this.item.data.name);
        //     if(!isNaN(count)){
        //         if(e.deltaY < 0){
        //             this.item.data.name = (count + 1).toString();
        //         }
        //         if(e.deltaY > 0){
        //             this.item.data.name = (count - 1).toString();
        //         }
        //     }
        // }

        return itemElement
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        tooltip.innerText = `${this.item.data.name}`;
        tooltip.style.color = 'rgb(255, 85, 85)';
        return tooltip;
    }

    repr(): string {
        return `${this.item.data.name}`;
    }
}

export class Txt extends NamedItem {
    backgroundUrl = 'https://dfonline.dev/public/images/STRING.png';
    declare item: Text;

    movable = true;

    constructor(item: Text) {
        super(item);
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        minecraftColorHTML(this.item.data.name).forEach(color => tooltip.append(color));
        return tooltip;
    }

    repr(): string {
        return `${this.item.data.name.replace('\n', '\\n')}`;
    }
}

export class Comp extends NamedItem {
    backgroundUrl = 'https://dfonline.dev/public/images/BOOK.png';
    declare item: Component;
    
    movable = true;

    constructor(item: Component) {
        super(item)
    }
    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        tooltip.innerText = this.item.data.name;
        return tooltip;
    }
    repr(): string {
        return this.item.data.name;
    }
    
}

export class Var extends NamedItem {
    backgroundUrl = 'https://dfonline.dev/public/images/MAGMA_CREAM.png';
    declare item: Variable;

    movable = true;

    constructor(item: Variable) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const scope = document.createElement('select');
        scope.onchange = () => { this.item.data.scope = scope.value as VarScope; chestMenu(Block); };
        scope.onclick = e => e.stopPropagation();
        scope.innerHTML = `
        <option value="unsaved">GAME</option>
        <option value="saved">SAVED</option>
        <option value="local">LOCAL</option>
        <option value="line">LINE</option>
        `;
        scope.value = this.item.data.scope;

        const ctxBox = super.contextMenu(Block, Slot, 'Variable', [scope]);
        return ctxBox;
    }

    icon() {
        const itemElement = document.createElement('div');
        itemElement.style.backgroundImage = `url(${this.backgroundUrl})`;
        const scope = document.createElement('span');
        scope.innerText = SCOPE_TO_NAME_MAP[this.item.data.scope].substring(0, 1);
        scope.style.color = VarScopeColor[this.item.data.scope];
        itemElement.append(scope);
        return itemElement;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        tooltip.innerText = `${this.item.data.name}`;
        const scope = document.createElement('span');
        scope.innerText = ScopeName[this.item.data.scope];
        scope.style.color = VarScopeColor[this.item.data.scope];
        tooltip.append(document.createElement('br'), scope);
        return tooltip;
    }

    repr(): string {
        return `${ScopeName[this.item.data.scope]} ${this.item.data.name}`;
    }
}

export class Loc extends ChestItem<Location> {
    backgroundUrl = 'https://dfonline.dev/public/images/PAPER.png';

    movable = true;

    constructor(item: Location) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const x = document.createElement('input');
        const y = document.createElement('input');
        const z = document.createElement('input');
        const pitch = document.createElement('input');
        const yaw = document.createElement('input');

        x.type = 'number';
        y.type = 'number';
        z.type = 'number';
        pitch.type = 'number';
        yaw.type = 'number';

        x.value = `${this.item.data.loc.x}`;
        y.value = `${this.item.data.loc.y}`;
        z.value = `${this.item.data.loc.z}`;
        pitch.value = `${this.item.data.loc}`;
        yaw.value = `${this.item.data.loc.yaw}`;

        x.onchange = () => this.item.data.loc.x = parseFloat(x.value);
        y.onchange = () => this.item.data.loc.y = parseFloat(y.value);
        z.onchange = () => this.item.data.loc.z = parseFloat(z.value);
        pitch.onchange = () => this.item.data.loc.pitch = parseFloat(pitch.value);
        yaw.onchange = () => this.item.data.loc.yaw = parseFloat(yaw.value);

        x.onclick = e => e.stopPropagation();
        y.onclick = e => e.stopPropagation();
        z.onclick = e => e.stopPropagation();
        pitch.onclick = e => e.stopPropagation();
        yaw.onclick = e => e.stopPropagation();

        const ctxBox = super.contextMenu(Block, Slot, 'Loc', [x, y, z, pitch, yaw]);
        return ctxBox;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const title = document.createElement('span');
        title.innerText = 'Location';
        title.style.color = '#55FF55';
        tooltip.append(title);
        tooltip.append(document.createElement('br'));
        const x = document.createElement('span');
        x.innerText = `X: ${this.item.data.loc.x}`;
        const y = document.createElement('span');
        y.innerText = `Y: ${this.item.data.loc.y}`;
        const z = document.createElement('span');
        z.innerText = `Z: ${this.item.data.loc.z}`;
        const pitch = document.createElement('span');
        pitch.innerText = `p: ${this.item.data.loc.pitch}`;
        const yaw = document.createElement('span');
        yaw.innerText = `y: ${this.item.data.loc.yaw}`;
        tooltip.append(x, document.createElement('br'), y, document.createElement('br'), z, document.createElement('br'), pitch, document.createElement('br'), yaw);
        return tooltip;
    }

    repr(): string {
        return `[${this.item.data.loc.x}, ${this.item.data.loc.y}, ${this.item.data.loc.z}, ${this.item.data.loc.pitch}, ${this.item.data.loc.yaw}]`;
    }
}

export class Vec extends ChestItem<Vector> {
    backgroundUrl = 'https://dfonline.dev/public/images/PRISMARINE_SHARD.png';

    movable = true;

    constructor(item: Vector) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const x = document.createElement('input');
        const y = document.createElement('input');
        const z = document.createElement('input');

        x.type = 'number';
        y.type = 'number';
        z.type = 'number';

        x.value = `${Number(this.item.data.x)}`;
        y.value = `${Number(this.item.data.y)}`;
        z.value = `${Number(this.item.data.z)}`;

        x.onchange = () => this.item.data.x = parseFloat(x.value);
        y.onchange = () => this.item.data.y = parseFloat(y.value);
        z.onchange = () => this.item.data.z = parseFloat(z.value);

        x.onclick = e => e.stopPropagation();
        y.onclick = e => e.stopPropagation();
        z.onclick = e => e.stopPropagation();

        const ctxBox = super.contextMenu(Block, Slot, 'Vec', [x, y, z]);
        return ctxBox;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const title = document.createElement('span');
        title.innerText = 'Vector';
        title.style.color = '#2AFFAA';
        tooltip.append(title);
        tooltip.append(document.createElement('br'));
        const x = document.createElement('span');
        x.innerText = `X: ${this.item.data.x}`;
        const y = document.createElement('span');
        y.innerText = `Y: ${this.item.data.y}`;
        const z = document.createElement('span');
        z.innerText = `Z: ${this.item.data.z}`;
        tooltip.append(x, document.createElement('br'), y, document.createElement('br'), z);
        return tooltip;
    }

    repr(): string {
        return `<${this.item.data.x}, ${this.item.data.y}, ${this.item.data.z}>`;
    }
}

export class Pot extends ChestItem<Potion> {
    backgroundUrl = 'https://dfonline.dev/public/images/DRAGON_BREATH.png';

    movable = true;

    constructor(item: Potion) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const search = Object.fromEntries(ActDB.potions.map(p => {
            const clear = stripColors(p.icon.name)
            return [clear, [clear, p.potion]]
        }));

        const valueCtx = new SelectionContext('Potion Value', search, true, false);
        valueCtx.callback = pot => {
            this.item.data.pot = pot;
            chestMenu(Block);
        }

        const durationLabel = document.createElement('label');
        durationLabel.innerText = 'Duration: ';
        const duration = document.createElement('input');
        duration.type = 'number';
        duration.value = `${Number(this.item.data.dur)}`;
        duration.onchange = () => {
            // limit to 0
            if (parseInt(duration.value) < 0) {
                duration.value = '0';
            }
            this.item.data.dur = parseInt(duration.value);
        };
        duration.onclick = e => e.stopPropagation();
        durationLabel.append(duration);

        const amplificationLabel = document.createElement('label');
        amplificationLabel.innerText = 'Amplification: ';
        const amplification = document.createElement('input');
        amplification.type = 'number';
        amplification.value = `${Number(this.item.data.amp)}`;
        amplification.onchange = () => this.item.data.amp = parseInt(amplification.value);
        amplification.onclick = e => e.stopPropagation();
        amplificationLabel.append(amplification);

        const ctxBox = super.contextMenu(Block, Slot, 'Pot', [valueCtx.subMenu, durationLabel, amplificationLabel]);
        return ctxBox;
    }

    icon(): HTMLDivElement {
        const icon = super.icon();
        icon.style.filter = `drop-shadow(0 0 5px ${iconPropToMCHTML(ActDB.potions.find(p => stripColors(p.icon.name) === this.item.data.pot))[0].style.color})`;
        return icon;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const value = document.createElement('span');
        iconPropToMCHTML(ActDB.potions.find(p => stripColors(p.icon.name) === this.item.data.pot)).forEach(c => value.append(c));
        const amplification = document.createElement('span');
        amplification.innerText = `Amplification: ${this.item.data.amp}`;
        const duration = document.createElement('span');
        duration.innerText = `Duration: ${this.item.data.dur} ticks`;
        tooltip.append(value, document.createElement('br'), amplification, document.createElement('br'), duration);

        return tooltip;
    }

    repr(): string {
        return `${this.item.data.pot} ${this.item.data.amp} ${this.item.data.dur}t`;
    }
}

export class Snd extends ChestItem<Sound> {
    backgroundUrl = 'https://dfonline.dev/public/images/NAUTILUS_SHELL.png';

    movable = true;

    constructor(item: Sound) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = 'Sound';
        search.value = this.item.data.sound;
        search.onkeyup = e => {
            if (e.key === 'Enter') {
                const snd = ActDB.sounds.find(s => stripColors(s.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || s.sound.toLowerCase().includes(search.value.toLowerCase()));
                if (snd) {
                    this.item.data.sound = stripColors(snd.icon.name);
                    chestMenu(Block);
                    search.value = stripColors(snd.icon.name);
                    valueCtx.close();
                }
                return;
            }

            results.innerHTML = '';
            ActDB.sounds.filter(s => stripColors(s.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || s.sound.toLowerCase().includes(search.value.toLowerCase())).forEach(s => {
                const result = document.createElement('button');
                iconPropToMCHTML(s).forEach(c => result.append(c));
                const trueName = document.createElement('span');
                trueName.innerText = ` ${s.sound}`;
                trueName.style.color = '#aaa';
                result.append(trueName);

                result.style.width = '100%';
                result.onclick = () => {
                    const res = stripColors(s.icon.name);
                    search.value = res;
                    this.item.data.sound = res;
                    chestMenu(Block);
                    valueCtx.close();
                }
                results.append(result);
            });
        }
        const results = document.createElement('div');
        results.id = 'results';
        const valueCtx = new ContextMenu('Value', [search, results]);

        const pitchLabel = document.createElement('label');
        pitchLabel.innerText = 'Pitch: ';
        const pitch = document.createElement('input');
        pitch.type = 'number';
        pitch.value = `${Number(this.item.data.pitch)}`;
        // limit pitch from 0 to 2
        pitch.onchange = () => {
            const val = parseFloat(pitch.value);
            if (val < 0) pitch.value = '0';
            if (val > 2) pitch.value = '2';
            this.item.data.pitch = parseFloat(pitch.value);
        }
        pitch.onclick = e => e.stopPropagation();
        pitchLabel.append(pitch);

        const volumeLabel = document.createElement('label');
        volumeLabel.innerText = 'Volume: ';
        const volume = document.createElement('input');
        volume.type = 'number';
        volume.value = `${Number(this.item.data.vol)}`;
        // limit volume from 0
        volume.onchange = () => {
            const val = parseFloat(volume.value);
            if (val < 0) volume.value = '0';
            this.item.data.vol = parseFloat(volume.value);
        }
        volume.onclick = e => e.stopPropagation();
        volumeLabel.append(volume);

        const ctxBox = super.contextMenu(Block, Slot, 'Sound', [valueCtx.subMenu, pitchLabel, volumeLabel]);
        return ctxBox;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const value = document.createElement('span');
        iconPropToMCHTML(ActDB.sounds.find(s => stripColors(s.icon.name) === this.item.data.sound)).forEach(c => value.append(c));
        const stats = document.createElement('span');
        stats.innerText = `Pitch: ${this.item.data.pitch}\nVolume: ${this.item.data.vol}`
        tooltip.append(value, document.createElement('br'), stats);
        return tooltip;
    }

    repr(): string {
        return `${this.item.data.sound} ${this.item.data.pitch} ${this.item.data.vol}`;
    }
}

export class Part extends ChestItem<Particle> {
    backgroundUrl = 'https://dfonline.dev/public/images/WHITE_DYE.png';

    movable = true;

    private get parsed() {
        const parsed = ActDB.particles.find(p => stripColors(p.icon.name) === this.item.data.particle);
        if (!parsed) throw new Error(`Particle name "${this.item.data.particle}" does not exist.`);
        return parsed;
    }
    constructor(item: Particle) {
        super(item);
        if (this.parsed == undefined) throw new Error(`Particle ${item.data.particle} not found`);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = 'Particle';
        search.value = this.item.data.particle;
        search.onkeyup = e => {
            if (e.key === 'Enter') {
                const part = ActDB.particles.find(p => stripColors(p.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || p.particle.toLowerCase().includes(search.value.toLowerCase()));
                if (part) {
                    this.item.data.particle = stripColors(part.icon.name);
                    this.item.data.data = {
                        material: 'STONE',
                        rgb: 0xFFFFFF,
                        colorVariation: 0,
                        x: 1,
                        y: 0,
                        z: 0,
                        motionVariation: 0,
                        sizeVariation: 0,
                        size: 1,
                    }
                    chestMenu(Block);
                    search.value = stripColors(part.icon.name);
                    valueCtx.close();
                    ctxBox.close();
                }
                return;
            }

            results.innerHTML = '';
            ActDB.particles.filter(p => stripColors(p.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || p.particle.toLowerCase().includes(search.value.toLowerCase())).forEach(p => {
                const result = document.createElement('button');
                iconPropToMCHTML(p).forEach(c => result.append(c));
                const trueName = document.createElement('span');
                trueName.style.color = '#aaa';
                trueName.innerText = ` ${p.particle}`;
                result.append(trueName);

                result.style.width = '100%';
                result.onclick = () => {
                    const res = stripColors(p.icon.name);
                    search.value = res;
                    this.item.data.particle = res;
                    this.item.data.data = {
                        material: 'STONE',
                        rgb: 0xFFFFFF,
                        colorVariation: 0,
                        x: 1,
                        y: 0,
                        z: 0,
                        motionVariation: 0,
                        sizeVariation: 0,
                        size: 1,
                    }
                    chestMenu(Block);
                    valueCtx.close();
                    ctxBox.close();
                }
                results.append(result);
            });
        }
        const results = document.createElement('div');
        results.id = 'results';
        const valueCtx = new ContextMenu('Value', [search, results]);

        //#region Amount
        const amountLabel = document.createElement('label');
        amountLabel.innerText = 'Amount: ';
        const amount = document.createElement('input');
        amount.type = 'number';
        amount.value = `${Number(this.item.data.cluster.amount)}`;
        amount.onchange = () => {
            const val = parseInt(amount.value);
            if (val < 1) amount.value = '1';
            this.item.data.cluster.amount = val;
        }
        amount.onclick = e => e.stopPropagation();
        amountLabel.append(amount);
        //#endregion

        //#region Cluster
        const spreadLabel = document.createElement('label');
        spreadLabel.innerText = 'Spread: ';
        const horizontal = document.createElement('input');
        horizontal.type = 'number';
        horizontal.value = `${Number(this.item.data.cluster.horizontal)}`;
        horizontal.onchange = () => { this.item.data.cluster.horizontal = parseInt(horizontal.value); }
        horizontal.style.width = '50px';
        const vertical = document.createElement('input');
        vertical.type = 'number';
        vertical.value = `${Number(this.item.data.cluster.vertical)}`;
        vertical.onchange = () => { this.item.data.cluster.vertical = parseInt(vertical.value); }
        vertical.style.width = '50px';
        spreadLabel.append(horizontal, vertical);
        //#endregion

        //#region Conditinal ones
        const conditinals = document.createElement('div');
        if (this.parsed.fields.includes('Color')) {
            const colorLabel = document.createElement('label');
            colorLabel.innerText = 'Color: ';
            const color = document.createElement('input');
            color.type = 'color';
            color.value = '#' + (this.item.data.data.rgb || 0xFF0000).toString(16);
            color.onchange = () => { this.item.data.data.rgb = parseInt(color.value.replace('#', ''), 16) || 0x000000; }
            color.onclick = e => e.stopPropagation();
            colorLabel.append(color);
            conditinals.append(colorLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Color Variation')) {
            const colorVarLabel = document.createElement('label');
            colorVarLabel.innerText = 'Color Variation: ';
            const colorVar = document.createElement('input');
            colorVar.type = 'number';
            colorVar.value = Number(this.item.data.data.colorVariation).toString(16);
            colorVar.onchange = () => {
                const val = parseInt(colorVar.value, 16);
                if (val < 0) colorVar.value = '0';
                if (val > 100) colorVar.value = '100';
                this.item.data.data.colorVariation = val;
            }
            colorVar.onclick = e => e.stopPropagation();
            colorVarLabel.append(colorVar);
            conditinals.append(colorVarLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Size')) {
            const sizeLabel = document.createElement('label');
            sizeLabel.innerText = 'Size: ';
            const size = document.createElement('input');
            size.type = 'number';
            size.value = `${Number(this.item.data.data.size)}`;
            size.onchange = () => {
                const val = parseInt(size.value);
                if (val < 0) size.value = '0';
                this.item.data.data.size = val;
            }
            size.onclick = e => e.stopPropagation();
            sizeLabel.append(size);
            conditinals.append(sizeLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Size Variation')) {
            const sizeVarLabel = document.createElement('label');
            sizeVarLabel.innerText = 'Size Variation: ';
            const sizeVar = document.createElement('input');
            sizeVar.type = 'number';
            sizeVar.value = `${Number(this.item.data.data.sizeVariation)}`;
            sizeVar.onchange = () => {
                const val = parseInt(sizeVar.value);
                if (val < 0) sizeVar.value = '0';
                if (val > 100) sizeVar.value = '100';
                this.item.data.data.sizeVariation = val;
            }
            sizeVar.onclick = e => e.stopPropagation();
            sizeVarLabel.append(sizeVar);
            conditinals.append(sizeVarLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Material')) {
            const materialLabel = document.createElement('label');
            materialLabel.innerText = 'Material: ';
            const material = document.createElement('input');
            material.type = 'text';
            material.value = `${this.item.data.data.material}`;
            material.onchange = () => { this.item.data.data.material = material.value; }
            material.onclick = e => e.stopPropagation();
            materialLabel.append(material);
            conditinals.append(materialLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Motion')) {
            const motionLabel = document.createElement('label');
            motionLabel.innerText = 'Motion: ';

            const X = document.createElement('input');
            X.type = 'number';
            X.value = `${Number(this.item.data.data.x)}`;
            X.onchange = () => { this.item.data.data.x = parseFloat(X.value); }
            X.onclick = e => e.stopPropagation();
            X.style.width = '50px';

            const Y = document.createElement('input');
            Y.type = 'number';
            Y.value = `${Number(this.item.data.data.y)}`;
            Y.onchange = () => { this.item.data.data.y = parseFloat(Y.value); }
            Y.onclick = e => e.stopPropagation();
            Y.style.width = '50px';

            const Z = document.createElement('input');
            Z.type = 'number';
            Z.value = `${Number(this.item.data.data.z)}`;
            Z.onchange = () => { this.item.data.data.z = parseFloat(Z.value); }
            Z.onclick = e => e.stopPropagation();
            Z.style.width = '50px';
            motionLabel.append(X, Y, Z);
            conditinals.append(motionLabel, document.createElement('br'));
        }
        if (this.parsed.fields.includes('Motion Variation')) {
            const motionVarLabel = document.createElement('label');
            motionVarLabel.innerText = 'Motion Variation: ';
            const motionVar = document.createElement('input');
            motionVar.type = 'number';
            motionVar.value = `${Number(this.item.data.data.motionVariation)}`;
            motionVar.onchange = () => {
                const val = parseInt(motionVar.value);
                if (val < 0) motionVar.value = '0';
                if (val > 100) motionVar.value = '100';
                this.item.data.data.motionVariation = val;
            }
            motionVar.onclick = e => e.stopPropagation();
            motionVarLabel.append(motionVar);
            conditinals.append(motionVarLabel, document.createElement('br'));
        }
        //#endregion

        const ctxBox = super.contextMenu(Block, Slot, 'Particle', [valueCtx.subMenu, amountLabel, spreadLabel, conditinals]);
        return ctxBox;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');

        const particle = document.createElement('span');
        iconPropToMCHTML(this.parsed).forEach(c => particle.append(c));

        const amount = document.createElement('span');
        amount.innerText = `Amount: ${this.item.data.cluster.amount}`;
        const spread = document.createElement('span');
        spread.innerText = `Spread: ${this.item.data.cluster.horizontal} ${this.item.data.cluster.vertical}`;

        tooltip.append(particle, document.createElement('br'), amount, document.createElement('br'), spread);

        if (this.parsed.fields.includes('Color')) {
            const hex = (this.item.data.data.rgb || 0xFF0000).toString(16).padStart(6, '0');
            const colorLabel = document.createElement('label');
            colorLabel.innerText = 'Color: ';
            const color = document.createElement('span');
            color.innerText = `#${hex.toUpperCase()}`;
            color.style.color = `#${hex}`;
            colorLabel.append(color);

            tooltip.append(document.createElement('br'), colorLabel);
        }
        if (this.parsed.fields.includes('Color Variation')) {
            const colorVariation = document.createElement('span');
            colorVariation.innerText = `Color Variation: ${Number(this.item.data.data.colorVariation)}%`;

            tooltip.append(document.createElement('br'), colorVariation);
        }
        if (this.parsed.fields.includes('Size')) {
            const size = document.createElement('span');
            size.innerText = `Size: ${Number(this.item.data.data.size)}`;

            tooltip.append(document.createElement('br'), size);
        }
        if (this.parsed.fields.includes('Size Variation')) {
            const sizeVariation = document.createElement('span');
            sizeVariation.innerText = `Size Variation: ${Number(this.item.data.data.sizeVariation)}%`;

            tooltip.append(document.createElement('br'), sizeVariation);
        }
        if (this.parsed.fields.includes('Material')) {
            const material = document.createElement('span');
            material.innerText = `Material: ${(this.item.data.data.material || "").toLowerCase()}`;
            tooltip.append(document.createElement('br'), material);
        }
        if (this.parsed.fields.includes('Motion')) {
            const motionLabel = document.createElement('label');
            motionLabel.innerText = 'Motion: ';
            const motion = document.createElement('span');
            motion.innerText = `${this.item.data.data.x} ${this.item.data.data.y} ${this.item.data.data.z}`;
            motion.style.color = '#2affaa';
            motionLabel.append(motion);

            tooltip.append(document.createElement('br'), motionLabel);
        }
        if (this.parsed.fields.includes('Motion Variation')) {
            const motionVariation = document.createElement('span');
            motionVariation.innerText = `Motion Variation: ${this.item.data.data.motionVariation}%`;

            tooltip.append(document.createElement('br'), motionVariation);
        }

        return tooltip;
    }

    repr(): string {
        return `${this.item.data.particle} ${this.item.data.cluster.amount} ${this.item.data.cluster.horizontal} ${this.item.data.cluster.vertical} ${(this.item.data.data.rgb || 0xFF0000)} ${this.item.data.data.colorVariation} ${this.item.data.data.size} ${this.item.data.data.sizeVariation} ${this.item.data.data.material} ${this.item.data.data.x} ${this.item.data.data.y} ${this.item.data.data.z} ${this.item.data.data.motionVariation}`;
    }
}

export class Gval extends ChestItem<GameValue> {
    backgroundUrl = 'https://dfonline.dev/public/images/NAME_TAG.png';

    movable = true;

    constructor(item: GameValue) {
        super(item);
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = 'Game Value';
        search.value = this.item.data.type;
        search.onkeyup = e => {
            if (e.key === 'Enter') {
                const gval = ActDB.gameValues.find(g => stripColors(g.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || stripColors(g.icon.name).toLowerCase().includes(search.value.toLowerCase()));
                if (gval) {
                    this.item.data.type = stripColors(gval.icon.name);
                    chestMenu(Block);
                    search.value = stripColors(gval.icon.name);
                    valueCtx.close();
                }
                return;
            }

            results.innerHTML = '';
            ActDB.gameValues.filter(g => stripColors(g.icon.name).toLowerCase().startsWith(search.value.toLowerCase()) || stripColors(g.icon.name).toLowerCase().includes(search.value.toLowerCase())).forEach(g => {
                const result = document.createElement('button');
                minecraftColorHTML(g.icon.name).forEach(c => result.append(c));

                result.style.width = '100%';
                result.onclick = () => {
                    const res = stripColors(g.icon.name);
                    search.value = res;
                    this.item.data.type = res;
                    chestMenu(Block);
                    valueCtx.close();
                }
                results.append(result);
            });
        }
        const results = document.createElement('div');
        results.id = 'results';
        const valueCtx = new ContextMenu('Value', [search, results]);

        const targetLabel = document.createElement('label');
        targetLabel.innerText = 'Target: ';
        const target = document.createElement('select');
        target.onchange = () => {
            this.item.data.target = target.value as GvalSelection;
            chestMenu(Block);
        }
        target.onclick = e => e.stopPropagation();
        SELECTION_VALUES.forEach(s => {
            if (s === '') return;
            const option = document.createElement('option');
            option.value = s;
            option.innerText = s;
            if (s === 'LastEntity') option.innerText = 'Last-Spawned Entity';
            target.append(option);
        });
        target.value = this.item.data.target;
        targetLabel.append(target);

        const ctxBox = super.contextMenu(Block, Slot, 'Game Value', [valueCtx.subMenu, targetLabel]);
        return ctxBox;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const value = document.createElement('span');
        iconPropToMCHTML(ActDB.gameValues.find(g => stripColors(g.icon.name) === this.item.data.type)).forEach(c => value.append(c));

        const targetLabel = document.createElement('span');
        targetLabel.style.color = '#aaa';
        targetLabel.innerText = 'Target: ';
        const target = document.createElement('span');
        let color;
        switch (this.item.data.target) {
            case 'Selection': case 'Default': color = '#55FF55'; break;
            case 'Killer': case 'Damager': color = '#FF5555'; break;
            case 'LastEntity': case 'Shooter': color = '#FFFF55'; break;
            case 'Victim': color = '#5555FF'; break;
            case 'Projectile': color = '#55FFFF'; break;
            default: color = '#fff'; break;
        }
        target.style.color = color;
        target.innerText = this.item.data.target;
        targetLabel.append(target);

        tooltip.append(value, document.createElement('br'), targetLabel);
        return tooltip;
    }

    repr(): string {
        return `${this.item.data.type} ${this.item.data.target}`;
    }
}

export class MCItem extends ChestItem<MinecraftItem> {
    backgroundUrl = 'dynamic';

    movable = true;

    private parsedItem: ParsedItem;

    constructor(item: MinecraftItem) {
        super(item);
        this.parsedItem = parse(item.data.item) as any as ParsedItem;
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const warning = document.createElement('p');
        warning.innerText = 'This item is not yet supported.';
        const ctxBox = super.contextMenu(Block, Slot, 'Minecraft Item', [warning]);
        return ctxBox;
    }

    icon(): HTMLDivElement {
        const icon = document.createElement('div');
        console.log(this.parsedItem.tag);
        icon.style.backgroundImage = `url(https://dfonline.dev/public/images/${this.parsedItem.id.replace('minecraft:', '').toUpperCase()}.png)`;
        const count = document.createElement('span');
        count.innerText = `${this.parsedItem.count.value}`
        if (this.parsedItem.count.value !== 1) icon.append(count);
        return icon;
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const name = document.createElement('span');
        if (this.parsedItem.tag && this.parsedItem.tag.display) {
            if ("Name" in this.parsedItem.tag.display) minecraftColorHTML(mcTextCompToCodes(this.parsedItem.tag.display.Name)).forEach(c => name.append(c));
            if ("Lore" in this.parsedItem.tag.display) {
                const lore = document.createElement('span');
                this.parsedItem.tag.display.Lore.forEach(l => {
                    minecraftColorHTML(mcTextCompToCodes(l), '§5§o').forEach(c => lore.append(c));
                    lore.append(document.createElement('br'));
                });
                tooltip.append(document.createElement('br'), lore);
            }
        }
        if (!name.innerText) {
            name.innerText = names.get(this.parsedItem.id);
        }
        tooltip.prepend(name);
        return tooltip;
    }

    repr(): string {
        return `${this.parsedItem.id}${JSON.stringify(this.parsedItem.tag ? this.parsedItem.tag : {})} ${this.parsedItem.count.value}`;
    }

    minecraftName(): HTMLSpanElement {
        const name = document.createElement('span');
        if (this.parsedItem.tag && this.parsedItem.tag.display) if ("Name" in this.parsedItem.tag.display) minecraftColorHTML(mcTextCompToCodes(this.parsedItem.tag.display.Name)).forEach(c => name.append(c));
        else name.innerText = names.get(this.parsedItem.id);
        return name;
    }
}

export class BlTag extends ChestItem<BlockTag> {
    backgroundUrl = 'dynamic';
    public tags: Tag;
    public tag: {
        name: string;
        icon: Icon;
        aliases: any[];
    }

    movable = false;

    constructor(item: BlockTag) {
        super(item);
        console.log(item);
        this.tags = findBlockTag(this.item.data.block, this.item.data.action, this.item.data.tag)!;
        this.tag = findBlockTagOption(this.item.data.block, this.item.data.action, this.item.data.tag, this.item.data.option)!;
    }

    contextMenu(block: number, _: number): ContextMenu {

        const tags = findBlockTag(this.item.data.block, this.item.data.action, this.item.data.tag);
        if (!tags) return new ContextMenu("Block Tag", []);
        const options = tags.options.map(tag => {
            const option = document.createElement('button');
            option.innerText = tag.name;
            option.onclick = () => {
                this.item.data.option = tag.name;
                chestMenu(block);
                valueCtx.close();
            }
            return option;
        });

        const updateVarTag = () => {
            if (input.value != '') {
                const tag: Variable = {
                    id: 'var',
                    data: {
                        name: input.value,
                        scope: select.value as VarScope
                    }
                }
                this.item.data.variable = tag;
            }
            else {
                this.item.data.variable = undefined;
            }
        }
        const variableRow = document.createElement('div');

        const select = document.createElement('select');
        select.innerHTML = `
        <option value="unsaved">G</option>
        <option value="saved">S</option>
        <option value="local">L</option>
        <option value="line">I</option>
        `;
        select.value = this.item.data.variable?.data?.scope ?? 'unsaved';
        select.onchange = () => { updateVarTag() }
        const input = document.createElement('input');
        input.value = this.item.data.variable?.data?.name ?? '';
        input.onchange = () => { updateVarTag() }
        input.onkeydown = e => {
            updateVarTag();
            if (e.key == 'Enter') valueCtx.close();
        }
        variableRow.append(input, select);
        const varTag = [
            variableRow,
            document.createElement('hr'),
        ];


        const valueCtx = new ContextMenu('Block Tag', [...varTag, ...options]);
        return valueCtx;
    }

    icon(): HTMLDivElement {
        return super.icon(`https://dfonline.dev/public/images/${this.tag.icon.material}.png`);
    }

    tooltip(): HTMLDivElement {
        const icon = document.createElement('div');
        const name = document.createElement('span');
        name.innerText = this.item.data.tag;
        name.style.color = 'yellow';
        icon.append(name, document.createElement('br'), document.createElement('br'));

        const tags = findBlockTag(this.item.data.block, this.item.data.action, this.item.data.tag);
        if (!tags) {
            icon.append(document.createElement('br'));
            return icon;
        }
        tags.options.forEach(tag => {
            const option = document.createElement('span');
            option.innerText = tag.name;
            if (this.item.data.option === tag.name) option.style.color = 'aqua';
            icon.append(option, document.createElement('br'));
        });

        if (this.item.data.variable != null) {
            const description = document.createElement('span');
            description.innerText = 'Var Tag:'
            const variable = document.createElement('span');
            variable.innerText = `[${VarScopeEnum[this.item.data.variable.data.scope][0]}] ${this.item.data.variable.data.name}`;
            variable.style.color = VarScopeColor[this.item.data.variable.data.scope];
            icon.append(document.createElement('br'), description, document.createElement('br'), variable);
        };

        return icon;
    }

    repr(): string {
        return `${this.tags.name} > ${this.tag.name}`;
    }
}

export class Param extends NamedItem {
    movable = true;
    backgroundUrl = 'https://dfonline.dev/public/images/ENDER_EYE.png';
    declare item: Parameter;
    
    constructor(item: Parameter) {
        super(item);
    }
        
    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        const name = document.createElement('span');
        name.innerText = this.item.data.name;
        name.style.color = ItemTypeColors.comp;
        tooltip.append(name,document.createElement('br'));
        const type = document.createElement('span');
        const typeName = document.createElement('span');
        typeName.innerText = `${ItemTypeNames[this.item.data.type]}${this.item.data.plural ? '(s)' : ''}`;
        typeName.style.color = ItemTypeColors[this.item.data.type];
        type.append(typeName)
        if(this.item.data.optional) type.append('*');
        tooltip.append(type);
        const description = document.createElement('span');
        const dash = document.createElement('span');
        dash.innerText = ' - ';
        dash.style.color = '#555';
        description.append(dash,this.item.data.description ?? this.item.data.name);
        // description.style.color = '#aaa';
        tooltip.append(description);
        if(this.item.data.default_value != null) {
            const defaultText = document.createElement('span');
            const arrowLmao = document.createElement('span');
            arrowLmao.innerText = '\n⏵ ';
            arrowLmao.style.color = '#55F';
            defaultText.append(arrowLmao);
            const defaultLiteral = document.createElement('span');
            defaultLiteral.innerText = 'Default = ';
            defaultLiteral.style.color = '#AAA';
            const theActualDefaultValue = document.createElement('span');
            try {
                theActualDefaultValue.innerText = ChestItem.getItem(this.item.data.default_value).repr();
                theActualDefaultValue.style.color = ItemTypeColors[this.item.data.default_value.id]
            }
            catch {
                theActualDefaultValue.innerText = 'An error happened.'
            }
            defaultText.append(arrowLmao,defaultLiteral,theActualDefaultValue)
            tooltip.append(defaultText);
        }
        if(this.item.data.note != null) {
            const note = document.createElement('note');
            const arrowLmao = document.createElement('span');
            arrowLmao.innerText = '\n⏵ ';
            arrowLmao.style.color = '#55F';
            note.append(arrowLmao,this.item.data.note);
            tooltip.append(note);
        }
        return tooltip;
    }

    repr(): string {
        return `${this.item.data.type} ${this.item.data.name}${this.item.data.plural ? '(s)' : ''}${this.item.data.optional ? '*' : ''} - ${this.item.data.description ?? this.item.data.name}`
    }

    contextMenu(Block: number, Slot: number): ContextMenu {
        const types = document.createElement('select');
        ParameterTypes.forEach(type => {
            const button = document.createElement('option');
            button.value = type;
            button.innerText = ItemTypeNames[type];
            types.append(button);
        });
        types.value = this.item.data.type;
        types.onchange = () => {
            this.item.data.type = types.value as ParameterTypeType;
            chestMenu(Block);
        }
        const count = document.createElement('label');
        count.innerText = 'Is Plural? ';
        const countTick = document.createElement('input');
        countTick.type = 'checkbox';
        countTick.checked = this.item.data.plural;
        countTick.onchange = () => {
            this.item.data.plural = countTick.checked;
            chestMenu(Block);
        }
        count.append(countTick);
        const optional = document.createElement('label');
        optional.innerText = 'Optional? ';
        const optionalTick = document.createElement('input');
        optionalTick.type = 'checkbox';
        optionalTick.checked = this.item.data.optional;
        optionalTick.onchange = () => {
            this.item.data.optional = optionalTick.checked;
            chestMenu(Block);
        };
        optional.append(optionalTick);
        const description = document.createElement('textarea');
        description.placeholder = 'Description';
        description.value = this.item.data.description ?? '';
        description.onkeydown = description.onkeyup = description.onchange = () => {
            this.item.data.description = description.value == '' ? undefined : description.value;
            chestMenu(Block)
        }
        const note = document.createElement('textarea');
        note.placeholder = 'Note';
        note.value = this.item.data.note ?? '';
        note.onkeydown = note.onkeyup = note.onchange = () => {
            this.item.data.note = note.value == '' ? undefined : note.value;
            chestMenu(Block);
        }
        return super.contextMenu(Block,Slot, 'Parameter',[types,count,optional,description,note]);
    }
}

function iconPropToMCHTML(obj?: Record<string, any> & { icon: Icon }) {
    return minecraftColorHTML(obj?.icon?.name || "");
}

export function getItem(item: Item): ChestItem<Item> {
    if (!isDefinedItem(item)) return new UnknownItem(item);
    switch (item.id) {
        case 'num': return new Num(item);
        case 'txt': return new Txt(item);
        case 'comp': return new Comp(item);
        case 'var': return new Var(item);
        case 'loc': return new Loc(item);
        case 'vec': return new Vec(item);
        case 'pot': return new Pot(item);
        case 'snd': return new Snd(item);
        case 'part': return new Part(item);
        case 'g_val': return new Gval(item);
        case 'item': return new MCItem(item);
        case 'bl_tag': return new BlTag(item);
        case 'pn_el': return new Param(item);
        default: throw new TypeError(`Item identity type lost during flow of execution. Unable to handle item: ${JSON.stringify(item)}`); // theoretically would never occur according to typescript.
    }
}

export function isDefinedItem(item: { id: unknown }): item is DefinedItems {
    if (typeof item.id !== "string") return false;
    if (
        item.id != "num" && item.id != "txt" && item.id != "var" &&
        item.id != "loc" && item.id != "vec" && item.id != "pot" &&
        item.id != "snd" && item.id != "part" && item.id != "g_val" &&
        item.id != "item" && item.id != "bl_tag" && item.id != 'comp' &&
        item.id != 'pn_el'
    ) return false;
    return true;
}
