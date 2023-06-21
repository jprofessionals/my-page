import jPro_logo_transparent from '../images/jPro_logo_transparent.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faX } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthContext } from '@/providers/AuthProvider'
import { useRouter } from 'next/router'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Fragment, useMemo } from 'react'
import { Button } from '../ui/button'
import cn from '@/utils/cn'

const navigation = [
  { href: '/admin', name: 'Admin 🛠️', requiresAdmin: true },
  { href: '/hyttebooking', name: 'Firmahytte' },
  { href: '/', name: 'Budsjett' },
  { href: '/utlysninger', name: 'Utlysninger' },
  { href: '/kalkulator', name: 'Lønnskalkulator' },
  { href: '/bidra', name: 'Bidra til min side' },
  { href: '/ai', name: 'AI' },
  { href: 'https://intranet.jpro.no', name: 'Intranett 🔗' },
]

const NavBar = () => {
  const { user, logout } = useAuthContext()
  const router = useRouter()

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
    <Disclosure as="nav" className="bg-black-nav">
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
                          aria-disabled={href === router.pathname}
                          className="text-white no-underline link"
                        >
                          {name}
                        </a>
                        <div
                          className={cn(
                            href !== router.pathname || 'bg-orange-brand',
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
                    'flex items-center',
                  )}
                >
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex text-sm bg-gray-800 rounded-full focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
                      <span className="sr-only">Open user menu</span>
                      <Image
                        src={user?.icon || '/default-profile.jpeg'}
                        alt="Icon"
                        width="40"
                        height="40"
                        className="rounded-full"
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-28 bg-white rounded-md ring-1 ring-black ring-opacity-5 shadow-lg origin-top-right focus:outline-none">
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
                <Disclosure.Button className="inline-flex justify-center items-center p-2 text-white rounded-md hover:text-white hover:bg-gray-700 focus:ring-2 focus:ring-inset focus:ring-white focus:outline-none">
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
              {user ? (
                <>
                  <hr className="!m-4" />
                  <div className="flex gap-10 justify-between px-4">
                    <div className="flex gap-2 text-white">
                      <Image
                        src={user?.icon || ''}
                        alt="Icon"
                        width="60"
                        height="60"
                        className="rounded-lg"
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
