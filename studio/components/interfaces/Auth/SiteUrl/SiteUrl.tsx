import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { Form, Input } from 'ui'
import { boolean, InferType, number, object, string } from 'yup'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
} from 'components/ui/Forms'
import { FormikHelpers } from 'formik'
import { useCheckPermissions, useStore } from 'hooks'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
  JWT_EXP: number()
    .max(604800, 'Must be less than 604800')
    .required('Must have a JWT expiry value'),
  REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
    .min(0, 'Must be a value more than 0')
    .required('Must have a Reuse Interval value'),
  SECURITY_CAPTCHA_ENABLED: boolean().required(),
  SECURITY_CAPTCHA_PROVIDER: string().required(),
  SECURITY_CAPTCHA_SECRET: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: () => string().required('Must have a Captcha secret'),
    otherwise: (schema) => schema,
  }),
})

type SiteURLSchema = InferType<typeof schema>

const SiteUrl = observer(() => {
  const { authConfig, ui } = useStore()
  const { isLoaded } = authConfig

  const formId = 'auth-config-general-form'
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES: SiteURLSchema = {
    DISABLE_SIGNUP: !authConfig.config.DISABLE_SIGNUP,
    JWT_EXP: authConfig.config.JWT_EXP,
    SITE_URL: authConfig.config.SITE_URL,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig.config.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig.config.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    SECURITY_CAPTCHA_ENABLED: authConfig.config.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_PROVIDER: authConfig.config.SECURITY_CAPTCHA_PROVIDER || 'hcaptcha',
    SECURITY_CAPTCHA_SECRET: authConfig.config.SECURITY_CAPTCHA_SECRET || '',
  }

  const onSubmit = async (
    values: SiteURLSchema,
    { setSubmitting, resetForm }: FormikHelpers<SiteURLSchema>
  ) => {
    const payload = { ...values }
    payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP

    setSubmitting(true)
    const { error } = await authConfig.update(payload)

    if (!error) {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated settings`,
      })
      resetForm({ values: values })
    } else {
      ui.setNotification({
        category: 'error',
        message: `Failed to update settings`,
      })
    }

    setSubmitting(false)
  }

  return (
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        useEffect(() => {
          resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
        }, [authConfig.isLoaded])

        return (
          <>
            <FormHeader
              title="Site URL"
              description="Configure the url of your site. This is used for password reset emails and other links."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection>
                <FormSectionContent loading={!isLoaded}>
                  <Input
                    id="SITE_URL"
                    size="small"
                    label="Site URL"
                    descriptionText="The base URL of your website. Used as an allow-list for redirects and for constructing URLs used in emails."
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
})

export default SiteUrl
