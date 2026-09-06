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
      description: 'Upload your photo. Use the hotspot tool to control crop framing.',
    },
    {
      name: 'takenAt',
      title: 'Taken At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      description: 'Date and time the photo was taken (used for feed chronology).',
    },
    {
      name: 'crop',
      title: 'Crop Data (Legacy)',
      type: 'object',
      hidden: true,
      fields: [
        { name: 'x', type: 'number' },
        { name: 'y', type: 'number' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
    },
    {
      name: 'scale',
      title: 'Scale (Legacy)',
      type: 'number',
      hidden: true,
    },
    {
      name: 'originalWidth',
      title: 'Original Width (Legacy)',
      type: 'number',
      hidden: true,
    },
    {
      name: 'originalHeight',
      title: 'Original Height (Legacy)',
      type: 'number',
      hidden: true,
    },
  ],
  preview: {
    select: {
      media: 'image',
      takenAt: 'takenAt',
      filename: 'image.asset.originalFilename',
    },
    prepare(selection: { media?: any; takenAt?: string; filename?: string }) {
      const { media, takenAt, filename } = selection;
      const dateStr = takenAt
        ? new Date(takenAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : undefined;

      return {
        title: dateStr || filename || 'Untitled Photo',
        subtitle: dateStr && filename ? filename : undefined,
        media,
      };
    },
  },
};