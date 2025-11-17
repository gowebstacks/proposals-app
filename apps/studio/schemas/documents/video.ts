import { defineType, defineField } from 'sanity'
import { PlayIcon } from '@sanity/icons'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Internal title for this video',
    }),
    defineField({
      name: 'muxVideoId',
      title: 'Mux Video ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Mux playback ID for the video',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Optional custom thumbnail image (will use Mux thumbnail if not provided)',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Optional description of the video',
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Video duration (e.g., "5:30")',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      muxVideoId: 'muxVideoId',
      thumbnail: 'thumbnail',
      description: 'description',
    },
    prepare({ title, muxVideoId, thumbnail, description }) {
      return {
        title: title || 'Untitled Video',
        subtitle: description || `Mux ID: ${muxVideoId}`,
        media: thumbnail || PlayIcon,
      }
    },
  },
})
