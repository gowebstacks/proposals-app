import { CalendarIcon } from '@sanity/icons'

export const ganttChart = {
  name: 'ganttChart',
  title: 'Gantt Chart',
  type: 'object',
  icon: CalendarIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the Gantt chart',
    },
    {
      name: 'tasks',
      title: 'Tasks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Task Name',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'startDate',
              title: 'Start Date',
              type: 'date',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'endDate',
              title: 'End Date',
              type: 'date',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'progress',
              title: 'Progress (%)',
              type: 'number',
              validation: (Rule: any) => Rule.min(0).max(100),
              description: 'Progress percentage (0-100)',
            },
            {
              name: 'dependencies',
              title: 'Dependencies',
              type: 'string',
              description: 'Optional: Task indices this depends on (comma-separated, e.g., "0,1")',
            },
          ],
          preview: {
            select: {
              name: 'name',
              startDate: 'startDate',
              endDate: 'endDate',
              progress: 'progress',
            },
            prepare(selection: any) {
              const { name, startDate, endDate, progress } = selection
              const progressText = progress !== undefined ? ` (${progress}%)` : ''
              return {
                title: name,
                subtitle: `${startDate} → ${endDate}${progressText}`,
              }
            },
          },
        },
      ],
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'viewMode',
      title: 'View Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Quarter Day', value: 'Quarter Day' },
          { title: 'Half Day', value: 'Half Day' },
          { title: 'Day', value: 'Day' },
          { title: 'Week', value: 'Week' },
          { title: 'Month', value: 'Month' },
          { title: 'Year', value: 'Year' },
        ],
      },
      initialValue: 'Day',
      description: 'Default time scale for the Gantt chart',
    },
    {
      name: 'showWeekends',
      title: 'Show Weekends',
      type: 'boolean',
      description: 'Display weekends in the timeline',
      initialValue: false,
    },
    {
      name: 'showProgress',
      title: 'Show Progress',
      type: 'boolean',
      description: 'Display progress bars on tasks',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      tasks: 'tasks',
    },
    prepare(selection: any) {
      const { title, tasks } = selection
      const taskCount = tasks?.length || 0
      return {
        title: `📊 ${title || 'Gantt Chart'}`,
        subtitle: `${taskCount} task${taskCount !== 1 ? 's' : ''}`,
      }
    },
  },
}
