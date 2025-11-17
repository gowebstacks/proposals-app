/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'frappe-gantt' {
  export interface Task {
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string
    custom_class?: string
    [key: string]: any
  }

  export interface GanttOptions {
    view_mode?: string
    bar_height?: number
    bar_corner_radius?: number
    arrow_curve?: number
    padding?: number
    view_modes?: string[]
    date_format?: string
    infinite_padding?: boolean
    readonly?: boolean
    scroll_to?: string
    custom_popup_html?: (task: any) => string
    on_click?: (task: any) => void
    on_date_change?: (task: any, start: Date, end: Date) => void
    on_progress_change?: (task: any, progress: number) => void
    on_view_change?: (mode: string) => void
    [key: string]: any
  }

  export default class Gantt {
    constructor(element: HTMLElement, tasks: Task[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: Task[]): void
    [key: string]: any
  }
}
