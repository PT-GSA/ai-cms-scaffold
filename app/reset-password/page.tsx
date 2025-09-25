"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { KeyRound, Loader2, Database, Eye, EyeOff, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have the necessary tokens from the URL
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!accessToken || !refreshToken) {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired",
        variant: "destructive",
      })
      router.push("/forgot-password")
    }
  }, [searchParams, router, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-xl bg-primary p-3">
              <Database className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {isSuccess ? "Password updated!" : "Create new password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="rounded-full bg-green-500/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-300 mb-2">Your password has been successfully updated!</p>
                  <p className="text-sm text-gray-400">You&apos;ll be redirected to your dashboard shortly.</p>
                </div>
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-gray-300">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Update password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!isSuccess && (
          <div className="text-center text-sm text-gray-400 mt-6">
            <p>
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
