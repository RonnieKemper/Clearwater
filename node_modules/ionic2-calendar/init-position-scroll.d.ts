import { EventEmitter, ElementRef, SimpleChanges, OnChanges, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import * as i0 from "@angular/core";
export declare class initPositionScrollComponent implements OnChanges, AfterViewInit, OnDestroy {
    private ngZone;
    initPosition: number;
    emitEvent?: boolean;
    onScroll: EventEmitter<number>;
    private element;
    private scrollContent;
    private handler;
    private listenerAttached;
    constructor(el: ElementRef, ngZone: NgZone);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<initPositionScrollComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<initPositionScrollComponent, "init-position-scroll", never, { "initPosition": "initPosition"; "emitEvent": "emitEvent"; }, { "onScroll": "onScroll"; }, never, ["*"], false, never>;
}
