import { PlayIcon } from '@sanity/icons'

export const videoModule = {
  name: 'videoModule',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    {
      name: 'video',
      title: 'Video',
      type: 'reference',
      to: [{ type: 'video' }],
      validation: (Rule: any) => Rule.required(),
      description: 'Select a video to embed',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption to display below the video',
    },
    {
      name: 'autoplay',
      title: 'Autoplay',
      type: 'boolean',
      initialValue: false,
      description: 'Automatically play the video when visible',
    },
    {
      name: 'loop',
      title: 'Loop',
      type: 'boolean',
      initialValue: false,
      description: 'Loop the video continuously',
    },
    {
      name: 'muted',
      title: 'Muted',
      type: 'boolean',
      initialValue: false,
      description: 'Start video muted',
    },
  ],
  preview: {
    select: {
      videoTitle: 'video.title',
      videoMuxId: 'video.muxVideoId',
      caption: 'caption',
      thumbnail: 'video.thumbnail',
    },
    prepare(selection: any) {
      const { videoTitle, videoMuxId, caption, thumbnail } = selection
      
      return {
        title: `🎥 ${videoTitle || 'Video'}`,
        subtitle: caption || `Mux ID: ${videoMuxId || 'Not set'}`,
        media: thumbnail || PlayIcon,
      }
    },
  },
}
