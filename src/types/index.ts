import { FUN_TYPE } from '@/constants'

export type PixelConversion = (px: number | string) => string

export interface FunToolConfig {
  pixelConversion?: PixelConversion
}

export type AttributeToolConfig = FunToolConfig
export type DistanceToolConfig = FunToolConfig

export interface ToolConfig {
  attribute?: AttributeToolConfig
  distance?: DistanceToolConfig
}

export interface UIInitOps {
  [FUN_TYPE.ATTRIBUTE]: (v: boolean) => void
  [FUN_TYPE.DISTANCE]: (v: boolean) => void
}

export interface EwuitOps {
  toolConfig: ToolConfig
  /**
   * 页面是否可滑动
   * @default false
   */
  scroll: boolean
}

export type EwuitCallMethodName = 'attribute' | 'distance'
