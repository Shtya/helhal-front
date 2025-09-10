// utils/validationSchemas.js
import * as yup from 'yup';

export const jobValidationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  
  categoryId: yup
    .string()
    .required('Category is required'),
  
  subcategoryId: yup
    .string()
    .nullable(),
  
  skillsRequired: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one skill is required'),
  
  attachments: yup
    .array()
    .of(yup.object({
      name: yup.string().required(),
      url: yup.string().required(),
      type: yup.string().required()
    })),
  
  additionalInfo: yup
    .string()
    .nullable(),
  
  budget: yup
    .number()
    .required('Budget is required')
    .min(1, 'Budget must be greater than 0')
    .typeError('Budget must be a number'),
  
  budgetType: yup
    .string()
    .required('Budget type is required')
    .oneOf(['fixed', 'hourly'], 'Invalid budget type'),
  
  budgetFlexible: yup
    .boolean()
    .default(false),
  
  preferredDeliveryDays: yup
    .number()
    .required('Delivery days are required')
    .min(1, 'Delivery days must be at least 1')
    .max(365, 'Delivery days cannot exceed 365')
    .typeError('Delivery days must be a number'),
  
  status: yup
    .string()
    .oneOf(['draft', 'published'], 'Invalid status')
    .default('draft')
});