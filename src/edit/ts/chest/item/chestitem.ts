import chestMenu from "../chestMenu";
import type { Item, Number } from "../../../template";
import ContextMenu from "../../../../main/context";

export default abstract class ChestItem {
    backgroundUrl : string;
    item : Item;

    abstract movable : boolean;

    constructor(item : Item){
        this.item = item;
    }


    abstract contextMenu(id : number) : ContextMenu;

    /**
     * Get the representation of the item as a HTML element.
     */
    abstract icon() : HTMLDivElement;

    /**
     * A HTML div with all the tooltip information.
     */
    abstract tooltip() : HTMLDivElement;

    /**
     * Dynamically get the item based of it's type.
     * @param item The item to parse.
     * @returns Any type of item, matching the type of the item.
     */
    static getItem(item : Item){
        return getItem(item);
    }
}

export class UnknownItem extends ChestItem {
    backgroundUrl = 'https://dfonline.dev/public/images/BARRIER.png';
    item: Item;

    movable = false;

    constructor(item: Item){
        super(item);
    }

    contextMenu(_id: number): ContextMenu {
        return new ContextMenu('Unknown',[],true);
    }

    icon(){
        const itemElement = document.createElement('div');

        itemElement.style.backgroundImage = `url(${this.backgroundUrl})`;
        itemElement.classList.add('fadepulse');

        return itemElement
    }

    tooltip(){
        const tooltip = document.createElement('div');
        tooltip.innerText = `This item couldn't be parsed.`;
        tooltip.style.color = '#ff0000';
        return tooltip;
    }
}

export class Num extends ChestItem {
    backgroundUrl = 'https://dfonline.dev/public/images/SLIME_BALL.png';
    item : Number;

    movable = true;

    constructor(item : Number){
        super(item);
    }

    contextMenu(id : number): ContextMenu {
        const value = document.createElement('input');

        value.value = this.item.data.name;
        value.onkeydown = e => {
            if(e.key === 'Enter'){
                if(!e.shiftKey){
                    this.item.data.name = value.value;
                    chestMenu(id);
                    ctxBox.close();
                }
                else{
                    value.value += '\n';
                }
            }
            if(e.key === 'Escape'){
                ctxBox.close();
            }
        }
        value.onclick = e => e.stopPropagation();

        const ctxBox = new ContextMenu('Number',[value]);

        return ctxBox;
    }

    icon(){
        const itemElement = document.createElement('div');
        
        itemElement.style.backgroundImage = `url(${this.backgroundUrl})`;
        const count = document.createElement('span');
        count.innerText = this.item.data.name;
        count.style.color = "rgb(255, 85, 85)"
        itemElement.append(count);
        
        return itemElement
    }

    tooltip(): HTMLDivElement {
        const tooltip = document.createElement('div');
        tooltip.innerText = `${this.item.data.name}`;
        tooltip.style.color = 'rgb(255, 85, 85)';
        return tooltip;
    }
}


function getItem(item : Item){
    switch(item.id){
        case 'num': return new Num(item);
        default: return new UnknownItem(item);
    }
}