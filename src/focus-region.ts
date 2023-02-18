import type {Focus, RegionOptions, RegionWrapper} from '@jneander/focus-dom'
import {MutableRefObject, RefCallback, useLayoutEffect} from 'react'

type FallbackRef = {fallbackOrder: number; ref: HTMLElement}

export class FocusRegion {
  private _focus: Focus
  private _focusRegion: RegionWrapper | null
  private _options: RegionOptions
  private _fallbackRefs: FallbackRef[]

  constructor(focus: Focus, options?: RegionOptions) {
    this._focus = focus
    this._options = options

    this._focusRegion = null
    this._fallbackRefs = []

    this.containerRef = this.containerRef.bind(this)
    this.fallbackRef = this.fallbackRef.bind(this)
  }

  containerRef(ref: HTMLElement): void {
    if (this._focusRegion == null) {
      this._focusRegion = this._focus.addRegion(ref, this._options)
    }

    this._focusRegion.setContainer(ref)
    this._fallbackRefs.forEach(({fallbackOrder, ref}) => {
      this._focusRegion.setFallback(ref, {fallbackOrder})
    })
  }

  fallbackRef(ref: HTMLElement): void {
    this.fallbackRefs(0)(ref)
  }

  fallbackRefs(fallbackOrder: number): RefCallback<HTMLElement> {
    return ref => {
      this._fallbackRefs = this._fallbackRefs.filter(ref => ref.fallbackOrder !== fallbackOrder)
      this._fallbackRefs.push({fallbackOrder, ref})
      if (this._focusRegion != null) {
        this._focusRegion.setFallback(ref, {fallbackOrder})
      }
    }
  }

  useBorrowEffect(ref: MutableRefObject<HTMLElement>): void {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      if (ref.current) {
        this._focusRegion.borrowFocus(ref.current)

        return () => {
          this._focusRegion.releaseFocus()
        }
      }
      // TODO: revisit the use of this ref to avoid hook-related misbehavior
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref.current])
  }

  borrowFocus(ref: MutableRefObject<HTMLElement>): void {
    this._focusRegion.borrowFocus(ref.current)
  }

  releaseFocus(): void {
    this._focusRegion.releaseFocus()
  }

  remove(): void {
    if (this._focusRegion) {
      this._focusRegion.remove()
    }
  }

  reconcile(): void {
    if (this._focusRegion) {
      this._focusRegion.reconcile()
    }
  }
}
