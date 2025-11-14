/**
 * Segment Analytics Utility Functions
 * Provides helper functions for tracking events, identifying users, and managing analytics
 */

interface FormField {
  name: string;
  value: string | number | boolean;
}

interface FormTrackingOptions {
  formId: string;
  formFields: FormField[];
  eventName?: string;
  additionalTraits?: Record<string, unknown>;
  additionalCompany?: Record<string, unknown>;
  additionalProperties?: Record<string, unknown>;
}

/**
 * Map form fields to user traits for Segment identify call
 */
const mapFormFieldsToTraits = (fields: FormField[]): Record<string, unknown> => {
  const traits: Record<string, unknown> = {};

  fields.forEach((field) => {
    const name = field.name.toLowerCase();

    // Email
    if (name.includes('email')) {
      traits.email = field.value;
    }
    // First name
    else if (name.includes('firstname') || name.includes('first_name')) {
      traits.firstName = field.value;
    }
    // Last name
    else if (name.includes('lastname') || name.includes('last_name')) {
      traits.lastName = field.value;
    }
    // Phone
    else if (name.includes('phone')) {
      traits.phone = field.value;
    }
    // Job title
    else if (name.includes('jobtitle') || name.includes('job_title')) {
      traits.title = field.value;
    }
  });

  return traits;
};

/**
 * Map form fields to company data for Segment group call
 */
const mapFormFieldsToCompany = (fields: FormField[]): Record<string, unknown> => {
  const company: Record<string, unknown> = {};

  fields.forEach((field) => {
    const name = field.name.toLowerCase();

    // Company name
    if (name.includes('company') && !name.includes('size') && !name.includes('industry')) {
      company.name = field.value;
    }
    // Industry
    else if (name.includes('industry')) {
      company.industry = field.value;
    }
    // Company size
    else if (name.includes('company_size') || name.includes('companysize') || name.includes('employees')) {
      company.size = field.value;
    }
    // Company domain
    else if (name.includes('company_domain') || name.includes('companydomain')) {
      company.domain = field.value;
    }
  });

  // If we have a company name but no domain, try to extract domain from email
  if (company.name && !company.domain) {
    const emailField = fields.find((f) => f.name.toLowerCase().includes('email'));
    if (emailField && typeof emailField.value === 'string') {
      const emailDomain = emailField.value.split('@')[1];
      if (emailDomain) {
        company.domain = emailDomain;
      }
    }
  }

  return company;
};

/**
 * Track form submission in Segment with identify, group, and track calls
 */
export const trackFormSubmission = ({
  formId,
  formFields,
  eventName,
  additionalTraits = {},
  additionalCompany = {},
  additionalProperties = {},
}: FormTrackingOptions) => {
  if (typeof window === 'undefined' || !window.analytics) {
    console.warn('Segment analytics not available');
    return;
  }

  // Map form fields to traits and company data
  const traits = {
    ...mapFormFieldsToTraits(formFields),
    ...additionalTraits,
  };

  const company = {
    ...mapFormFieldsToCompany(formFields),
    ...additionalCompany,
  };

  // 1. Identify call for user
  if (traits.email) {
    window.analytics.identify(traits.email as string, traits);
  }

  // 2. Group call if we have company info
  if (company.domain) {
    window.analytics.group(company.domain as string, company);
  }

  // Get form fields that aren't used in identify or group calls
  const identityFields = [
    'email',
    'emailaddress',
    'emailAddress',
    'work_email',
    'workEmail',
    'firstname',
    'firstName',
    'first_name',
    'lastname',
    'lastName',
    'last_name',
    'phone',
    'phoneNumber',
    'phone_number',
    'jobtitle',
    'jobTitle',
    'job_title',
  ];

  const companyFields = [
    'company',
    'companyName',
    'company_name',
    'industry',
    'companyIndustry',
    'company_industry',
    'company_size',
    'companySize',
    'employees',
    'company_domain',
    'companyDomain',
  ];

  const eventProperties = formFields.reduce((acc, field) => {
    // Only include fields that aren't used for identity or company
    if (!identityFields.includes(field.name) && !companyFields.includes(field.name)) {
      acc[field.name] = field.value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  // 3. Track the form submission with non-identity/group fields if eventName is provided
  if (eventName) {
    window.analytics.track(eventName, {
      formId,
      ...eventProperties,
      ...additionalProperties,
    });
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.analytics) {
    console.warn('Segment analytics not available');
    return;
  }

  window.analytics.track(eventName, properties);
};

/**
 * Identify a user
 */
export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.analytics) {
    console.warn('Segment analytics not available');
    return;
  }

  window.analytics.identify(userId, traits);
};

/**
 * Track a page view
 */
export const trackPage = (name?: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.analytics) {
    console.warn('Segment analytics not available');
    return;
  }

  if (name) {
    window.analytics.page(name, properties);
  } else {
    window.analytics.page(properties);
  }
};
