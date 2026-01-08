'use client'

import jPro_logo_transparent from '../images/jPro_logo_transparent.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faX } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthContext } from '@/providers/AuthProvider'
import { usePathname } from 'next/navigation'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Fragment, useMemo, useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import cn from '@/utils/cn'
import { getUsers } from '@/data/types'
import type { UserReadable } from '@/data/types'

const navigation = [
  { href: '/admin', name: 'Admin 🛠️', requiresAdmin: true },
  { href: '/admin/hyttetrekning', name: 'Hyttetrekning Admin', requiresAdmin: true },
  { href: '/admin/ktu', name: 'KTU Admin', requiresAdmin: true },
  { href: '/', name: 'Hjem' },
  { href: '/utlysninger', name: 'Utlysninger' },
  { href: '/salgstavle', name: 'Salgstavle' },
  { href: '/salgstavle-analytics', name: 'Salgsanalyse', requiresAdmin: true },
  { href: '/hyttebooking', name: 'Firmahytte' },
  { href: '/ktu', name: 'KTU' },
  { href: '/kalkulator', name: 'Lønnskalkulator' },
  { href: 'https://intranet.jpro.no', name: 'Intranett 🔗' },
]

const NavBar = () => {
  const { user, logout } = useAuthContext()
  const pathname = usePathname()

  // Test user selection (for local dev only)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const [testUserId, setTestUserId] = useState<string>('1')
  const [isMounted, setIsMounted] = useState(false)
  const [allUsers, setAllUsers] = useState<UserReadable[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false)
  }, [user?.email])

  // Get user icon, falling back to default if error or expired CVPartner URL
  const userIcon = useMemo(() => {
    if (imageError || !user?.icon) return '/default-profile.jpeg'
    // CVPartner URLs with AWS tokens expire - check if it looks expired
    if (user.icon.includes('X-Amz-Date=')) {
      try {
        const match = user.icon.match(/X-Amz-Date=(\d{8})T/)
        if (match) {
          const urlDate = match[1]
          const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          // If URL is more than 1 day old, it's likely expired
          if (urlDate < today) return '/default-profile.jpeg'
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return user.icon
  }, [user?.icon, imageError])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Read testUserId from localStorage after mount (SSR-safe)
  useEffect(() => {
    setIsMounted(true)
    const storedUserId = localStorage.getItem('testUserId')
    if (storedUserId) {
      setTestUserId(storedUserId)
    }
  }, [])

  // Fetch all users for the dev user selector
  useEffect(() => {
    if (isDevelopment && isMounted) {
      getUsers({ query: { isEnabled: true } })
        .then((response) => {
          if (response.data) {
            setAllUsers(response.data)
          }
        })
        .catch(() => {
          // Ignore errors - user selector is just a dev convenience
        })
    }
  }, [isDevelopment, isMounted])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter users based on search query (use email as identifier since id is null)
  const filteredUsers = useMemo(() => {
    const validUsers = allUsers.filter((u) => u.email)
    if (!searchQuery.trim()) return validUsers.slice(0, 10) // Show first 10 when no search
    const query = searchQuery.toLowerCase()
    return validUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    ).slice(0, 20)
  }, [allUsers, searchQuery])

  // Get current test user by email (stored in testUserId which now holds email)
  const currentTestUser = allUsers.find((u) => u.email === testUserId)

  // If stored testUserId doesn't match any user, use first available user
  useEffect(() => {
    if (allUsers.length > 0 && !currentTestUser) {
      const firstValidUser = allUsers.find((u) => u.email)
      if (firstValidUser?.email) {
        localStorage.setItem('testUserId', firstValidUser.email)
        setTestUserId(firstValidUser.email)
      }
    }
  }, [allUsers, currentTestUser, testUserId])

  const handleTestUserChange = (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('testUserId', userId)
      setTestUserId(userId)
      setShowUserDropdown(false)
      setSearchQuery('')
      window.dispatchEvent(new Event('testUserChanged'))
      window.location.reload()
    }
  }

  const navigationItems = useMemo(
    () =>
      navigation.filter(({ requiresAdmin }) => {
        if (requiresAdmin) {
          if (!user || !user.admin) return false
        }
        return true
      }),
    [user],
  )

  return (
    <Disclosure as="nav" className="bg-[var(--color-nav)]">
      {({ open }) => (
        <>
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex flex-1 justify-between items-end">
                <Link href="/">
                  <div
                    title="min side"
                    className="flex gap-2 items-center self-center text-white"
                  >
                    <Image
                      src={jPro_logo_transparent}
                      alt="jPro"
                      className="w-10 h-10 mb-[9px]"
                    />
                    <span>Min side</span>
                  </div>
                </Link>
                <div className="hidden h-full text-sm md:block">
                  <div className="flex space-x-4 h-full">
                    {navigationItems.map(({ href, name }) => (
                      <div key={name} className="flex flex-col gap-2">
                        <a
                          href={href}
                          aria-disabled={href === pathname}
                          className="text-white no-underline link"
                        >
                          {name}
                        </a>
                        <div
                          className={cn(
                            href !== pathname || 'bg-orange-brand',
                            'h-2',
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden md:block md:ml-6">
                <div
                  className={cn(
                    !user ? 'pointer-events-none' : '',
                    'flex items-center gap-3',
                  )}
                >
                  {/* Dev mode test user selector */}
                  {isDevelopment && isMounted && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 rounded-md px-3 py-1 text-xs text-white hover:bg-yellow-500/30"
                      >
                        <span>🧪</span>
                        <span className="max-w-40 truncate">
                          {currentTestUser?.name || (allUsers.length === 0 ? 'Laster...' : `ID: ${testUserId}`)}
                        </span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showUserDropdown && (
                        <div className="absolute right-0 mt-1 w-72 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50">
                          <div className="p-2 border-b border-gray-600">
                            <input
                              type="text"
                              placeholder="Søk etter bruker..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-yellow-500"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-400">Ingen brukere funnet</div>
                            ) : (
                              filteredUsers.map((u) => (
                                <button
                                  key={u.email}
                                  onClick={() => handleTestUserChange(u.email || '')}
                                  className={cn(
                                    'w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2',
                                    u.email === testUserId ? 'bg-yellow-500/20 text-yellow-300' : 'text-white'
                                  )}
                                >
                                  <span className="truncate flex-1">{u.name}</span>
                                  {u.admin && <span className="text-xs text-yellow-500">Admin</span>}
                                </button>
                              ))
                            )}
                          </div>
                          <div className="p-2 border-t border-gray-600 text-xs text-gray-400">
                            {allUsers.length} brukere tilgjengelig
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex text-sm bg-gray-800 rounded-full focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                      <span className="sr-only">Open user menu</span>
                      <Image
                        src={userIcon}
                        alt="Icon"
                        width="40"
                        height="40"
                        className="rounded-full"
                        unoptimized={userIcon.includes('cvpartner') || userIcon.includes('X-Amz')}
                        onError={() => setImageError(true)}
                      />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-28 bg-white rounded-md ring-1 ring-black/5 shadow-lg origin-top-right focus:outline-hidden">
                        <Menu.Item>
                          <Button className="w-full" onClick={() => logout()}>
                            Logg ut
                          </Button>
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
              <div className="flex -mr-2 md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex justify-center items-center p-2 text-white rounded-md hover:text-white hover:bg-gray-700 focus:ring-2 focus:ring-inset focus:ring-white focus:outline-hidden">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <div className="block w-6 h-6" aria-hidden="true">
                      <FontAwesomeIcon icon={faX} />
                    </div>
                  ) : (
                    <div className="block w-6 h-6" aria-hidden="true">
                      <FontAwesomeIcon icon={faBars} />
                    </div>
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="flex flex-col gap-2 px-2 pt-2 pb-3">
              {navigationItems.map(({ name, href }) => {
                return (
                  <Disclosure.Button
                    as="a"
                    href={href}
                    key={name}
                    className="block py-2 px-3 text-base font-medium text-white bg-gray-900 rounded-md"
                  >
                    {name}
                  </Disclosure.Button>
                )
              })}
              {/* Dev mode test user selector (mobile) */}
              {isDevelopment && isMounted && (
                <div className="mx-2 mb-2 bg-yellow-500/20 border border-yellow-500/50 rounded-md p-3">
                  <label className="block text-xs text-white mb-1 font-medium">
                    🧪 Test som bruker:
                  </label>
                  <div className="text-sm text-yellow-300 mb-2">
                    Nå: {currentTestUser?.name || (allUsers.length === 0 ? 'Laster...' : `ID: ${testUserId}`)}
                  </div>
                  <input
                    type="text"
                    placeholder="Søk etter bruker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 mb-2 focus:outline-none focus:border-yellow-500"
                  />
                  <div className="max-h-48 overflow-y-auto bg-gray-800 rounded border border-gray-600">
                    {filteredUsers.map((u) => (
                      <Disclosure.Button
                        key={u.email}
                        as="button"
                        onClick={() => handleTestUserChange(u.email || '')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2',
                          u.email === testUserId ? 'bg-yellow-500/20 text-yellow-300' : 'text-white'
                        )}
                      >
                        <span className="truncate flex-1">{u.name}</span>
                        {u.admin && <span className="text-xs text-yellow-500">Admin</span>}
                      </Disclosure.Button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {allUsers.length} brukere tilgjengelig
                  </div>
                </div>
              )}
              {user ? (
                <>
                  <hr className="!m-4" />
                  <div className="flex gap-10 justify-between px-4">
                    <div className="flex gap-2 text-white">
                      <Image
                        src={userIcon}
                        alt="Icon"
                        width="60"
                        height="60"
                        className="rounded-lg"
                        unoptimized={userIcon.includes('cvpartner') || userIcon.includes('X-Amz')}
                        onError={() => setImageError(true)}
                      />
                      <span className="flex flex-col flex-wrap">
                        <span>{user?.name}</span>
                        <span>{user?.email}</span>
                      </span>
                    </div>
                    <Disclosure.Button
                      as="button"
                      onClick={() => logout()}
                      className="block self-end py-2 px-3 text-base font-medium text-white bg-gray-900 rounded-md"
                    >
                      Logg ut
                    </Disclosure.Button>
                  </div>
                </>
              ) : null}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
export default NavBar
