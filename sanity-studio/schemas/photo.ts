export default {
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'crop',
      title: 'Crop Data',
      type: 'object',
      fields: [
        {
          name: 'x',
          type: 'number',
        },
        {
          name: 'y',
          type: 'number',
        },
        {
          name: 'width',
          type: 'number',
        },
        {
          name: 'height',
          type: 'number',
        },
      ],
    },
    {
      name: 'scale',
      title: 'Scale',
      type: 'number',
    },
    {
      name: 'originalWidth',
      title: 'Original Width',
      type: 'number',
    },
    {
      name: 'originalHeight',
      title: 'Original Height',
      type: 'number',
    },
  ],
  preview: {
    select: {
      media: 'image',
    },
  },
}; 