import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { getApiErrorMessage } from '@/lib/api'
import { updateProfile } from '@/lib/accounts-api'
import { useAuth } from '@/lib/auth'
import { disablePush, enablePush, getPushConfig } from '@/lib/push-api'

const identitySchema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  phone_number: z.string().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Mot de passe actuel requis'),
    new_password: z.string().min(8, 'Au moins 8 caractères'),
    confirm_password: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  })

export default function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const pushQuery = useQuery({ queryKey: ['push-config'], queryFn: getPushConfig })
  const pushMutation = useMutation({
    mutationFn: async () => pushQuery.data?.subscribed
      ? disablePush()
      : enablePush(pushQuery.data?.public_key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-config'] })
      toast.success(pushQuery.data?.subscribed ? 'Notifications désactivées' : 'Notifications activées sur cet appareil')
    },
    onError: (error) => toast.error(error.message || 'Impossible de configurer les notifications'),
  })

  const identityForm = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone_number: user?.phone_number || '',
    },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  const identityMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
      toast.success('Profil mis à jour')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le profil')),
  })

  const passwordMutation = useMutation({
    mutationFn: (values) =>
      updateProfile({ current_password: values.current_password, new_password: values.new_password }),
    onSuccess: () => {
      toast.success('Mot de passe changé')
      passwordForm.reset({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Mot de passe actuel incorrect')),
  })

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Mon profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notifications sur cet appareil</CardTitle>
          <CardDescription>Recevez les alertes SchoolConnect même lorsque le site n’est pas ouvert.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!pushQuery.data?.enabled ? (
            <p className="text-sm text-muted-foreground">Les notifications push ne sont pas configurées par l’administrateur. Elles nécessitent une connexion HTTPS et des clés VAPID.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{pushQuery.data.subscribed ? 'Les notifications sont activées sur cet appareil.' : 'Activez les notifications dans ce navigateur.'}</p>
              <Button onClick={() => pushMutation.mutate()} disabled={pushMutation.isPending || pushQuery.isLoading}>
                {pushMutation.isPending ? 'Mise à jour…' : pushQuery.data.subscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>{user?.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...identityForm}>
            <form
              onSubmit={identityForm.handleSubmit((values) => identityMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={identityForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={identityForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={identityForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={identityMutation.isPending}>
                {identityMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Changer de mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Changement...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
