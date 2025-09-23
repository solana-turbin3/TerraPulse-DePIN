'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Wifi, Zap, Globe } from 'lucide-react'
import { useWallets } from '@privy-io/react-auth/solana'

interface ApplicationForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: string
  longitude: string
  internetSpeed: string
  powerStability: string
  motivation: string
  walletAddress: string
}

const RegisterPage = () => {
  const [form, setForm] = useState<ApplicationForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: '',
    longitude: '',
    internetSpeed: '',
    powerStability: '',
    motivation: '',
    walletAddress: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocationDetecting, setIsLocationDetecting] = useState(false)
  const { wallets } = useWallets()

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const detectLocation = () => {
    setIsLocationDetecting(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          setIsLocationDetecting(false)
        },
        (error) => {
          console.error('Error detecting location:', error)
          setIsLocationDetecting(false)
          alert('Could not detect location. Please enter coordinates manually.')
        },
      )
    } else {
      setIsLocationDetecting(false)
      alert('Geolocation is not supported by this browser.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      alert('Application submitted successfully! You will be contacted within 7-10 business days.')
      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        latitude: '',
        longitude: '',
        internetSpeed: '',
        powerStability: '',
        motivation: '',
        walletAddress: '',
      })
    } catch (error) {
      alert('Error submitting application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              TerraPulse Device Application
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join the decentralized physical infrastructure network. Apply to receive your TerraPulse device and start
            earning rewards while contributing to global environmental monitoring.
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <Zap className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Earn Rewards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate passive income by contributing to the network
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <MapPin className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Global Impact</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Help monitor environmental data worldwide</p>
            </CardContent>
          </Card>

          <Card className="text-center border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <Wifi className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Easy Setup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Simple plug-and-play installation</p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Device Application Form</CardTitle>
            <CardDescription>
              Please provide accurate information to ensure successful device deployment and optimal network coverage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">Location Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                      <Input
                        id="zipCode"
                        value={form.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>GPS Coordinates *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={detectLocation}
                        disabled={isLocationDetecting}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        {isLocationDetecting ? 'Detecting...' : 'Auto-detect Location'}
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          value={form.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                          required
                          placeholder="40.7128"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          value={form.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                          required
                          placeholder="-74.0060"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Requirements */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-600 dark:text-purple-400">
                  Technical Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="internetSpeed">Internet Speed (Mbps) *</Label>
                    <Input
                      id="internetSpeed"
                      value={form.internetSpeed}
                      onChange={(e) => handleInputChange('internetSpeed', e.target.value)}
                      required
                      placeholder="e.g., 100 Mbps down / 20 Mbps up"
                    />
                  </div>
                  <div>
                    <Label htmlFor="powerStability">Power Stability *</Label>
                    <Input
                      id="powerStability"
                      value={form.powerStability}
                      onChange={(e) => handleInputChange('powerStability', e.target.value)}
                      required
                      placeholder="e.g., 99.9% uptime, UPS backup"
                    />
                  </div>
                </div>
              </div>

              {/* Blockchain Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">
                  Blockchain Information
                </h3>
                <div>
                  <Label htmlFor="walletAddress">Solana Wallet Address *</Label>
                  <Input
                    id="walletAddress"
                    value={wallets[0]?.address}
                    disabled
                    onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                    required
                    placeholder="Your Solana wallet address for rewards"
                  />
                </div>
              </div>

              {/* Motivation */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
                  Additional Information
                </h3>
                <div>
                  <Label htmlFor="motivation">Why do you want to join TerraPulse? *</Label>
                  <textarea
                    id="motivation"
                    value={form.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    required
                    placeholder="Tell us why you're interested in contributing to the TerraPulse network..."
                    className="w-full min-h-[100px] p-3 border rounded-md resize-vertical"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </Button>
                <p className="text-sm text-gray-500 text-center mt-4">
                  * Required fields. Your application will be reviewed within 7-10 business days.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
