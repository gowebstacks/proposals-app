import { PlayIcon } from '@sanity/icons'

export const reelCarousel = {
  name: 'reelCarousel',
  title: 'Reel Carousel',
  type: 'object',
  icon: PlayIcon,
  fields: [
    {
      name: 'videos',
      title: 'Videos',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'video' }],
        },
      ],
      validation: (Rule: any) => Rule.required().min(3).max(3),
      description: 'Select exactly 3 videos for the reel carousel',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional title for the carousel',
    },
  ],
  preview: {
    select: {
      title: 'title',
      video0: 'videos.0.title',
      video1: 'videos.1.title',
      video2: 'videos.2.title',
    },
    prepare(selection: any) {
      const { title, video0, video1, video2 } = selection
      const videoTitles = [video0, video1, video2].filter(Boolean)
      
      return {
        title: `🎬 ${title || 'Reel Carousel'}`,
        subtitle: videoTitles.length > 0 
          ? `${videoTitles.length} video${videoTitles.length !== 1 ? 's' : ''}: ${videoTitles.join(', ')}`
          : 'No videos selected',
      }
    },
  },
}
