// import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
// const jdenticon = require('jdenticon');

// @Directive({ selector: '[jdenticonHash]' })
// export class JdenticonHashDirective implements OnChanges {
//   @Input() jdenticonHash: string;

//   constructor(private el: ElementRef, private renderer: Renderer2) {}

//   private update() {
//     jdenticon.update(this.el.nativeElement, this.jdenticonHash);
//   }

//   ngOnInit(): void {
//     this.update();
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     this.update();
//   }
// }