import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon,
  CubeIcon,
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Prodotti', href: '/products', icon: CubeIcon },
  { name: 'Nuovo Prodotto', href: '/products/new', icon: PlusIcon },
  { name: 'Statistiche', href: '/stats', icon: ChartBarIcon },
  { name: 'Impostazioni', href: '/settings', icon: Cog6ToothIcon },
]

const quickActions = [
  { name: 'Importa Excel', href: '#', icon: DocumentArrowUpIcon },
  { name: 'Esporta Excel', href: '#', icon: DocumentArrowDownIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) {
  // Usa lo stato condiviso invece di uno stato locale
  const isCollapsed = sidebarCollapsed
  const setIsCollapsed = setSidebarCollapsed
  const location = useLocation()

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
      <div className="flex h-16 shrink-0 items-center">
        {!isMobile && !isCollapsed && (
          <h2 className="text-xl font-bold text-blu-primary">Menu</h2>
        )}
        {isMobile && (
          <h2 className="text-xl font-bold text-blu-primary">Menu</h2>
        )}
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-blu-light text-blu-primary'
                          : 'text-gray-700 hover:text-blu-primary hover:bg-gray-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                        !isMobile && isCollapsed ? 'justify-center' : ''
                      )}
                      onClick={() => setSidebarOpen(false)}
                      title={!isMobile && isCollapsed ? item.name : ''}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-blu-primary' : 'text-gray-400 group-hover:text-blu-primary',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {(isMobile || !isCollapsed) && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          
          <li>
            {(isMobile || !isCollapsed) && (
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider">
                Azioni Rapide
              </div>
            )}
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {quickActions.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={classNames(
                      'text-gray-700 hover:text-blu-primary hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                      !isMobile && isCollapsed ? 'justify-center' : ''
                    )}
                    title={!isMobile && isCollapsed ? item.name : ''}
                  >
                    <item.icon
                      className="text-gray-400 group-hover:text-blu-primary h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {(isMobile || !isCollapsed) && item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          
          <li className="-mx-6 mt-auto">
            <div className={classNames(
              'flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 border-t border-gray-200',
              !isMobile && isCollapsed ? 'justify-center' : ''
            )}>
              <div className="h-8 w-8 rounded-full bg-blu-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">BA</span>
              </div>
              {(isMobile || !isCollapsed) && (
                <>
                  <span className="sr-only">Il tuo profilo</span>
                  <span aria-hidden="true">Blu Area Admin</span>
                </>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Chiudi sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent isMobile={true} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className={classNames(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300',
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
          title={isCollapsed ? 'Espandi sidebar' : 'Riduci sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
        
        <div className={classNames(
          'flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white pt-20 transition-all duration-300',
          isCollapsed ? 'px-2' : 'px-6'
        )}>
          <SidebarContent isMobile={false} />
        </div>
      </div>
    </>
  )
}