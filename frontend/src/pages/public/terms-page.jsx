import { Link } from 'react-router'
import { LegalLayout } from '@/components/public/legal-layout'
import { PROVIDER } from '@/config/legal'
import { SCHOOL } from '@/data/school'
import { formatPhone } from '@/lib/format'

// The terms parents, drivers and school staff agree to when they create a
// Fika account. Have an advocate review them, and the school confirm its
// details and fees rules, before launch.
export function TermsPage() {
  const school = SCHOOL.name
  const sections = [
    {
      id: 'about',
      title: 'About these terms',
      body: (
        <>
          <p>
            Fika is a school transport app. <strong>{school}</strong> (“the
            school”) uses it to run its buses: routes, trips, live bus location,
            attendance and transport fees. Fika is provided to the school by{' '}
            {PROVIDER.person}, {PROVIDER.place} (“Fika”, “we”).
          </p>
          <p>
            These terms apply to everyone with a Fika account: parents and
            guardians, drivers and school staff. By creating an account you
            agree to them and to the <Link to="/privacy">Privacy notice</Link>.
            The school’s own transport rules (for example on behaviour on the
            bus) still apply alongside them.
          </p>
        </>
      ),
    },
    {
      id: 'accounts',
      title: 'Your account',
      body: (
        <ul>
          <li>
            You must be 18 or older. Parent accounts are for a child’s parent or
            legal guardian.
          </li>
          <li>
            Give true details and keep them up to date, especially your phone
            number and your child’s stops: the driver relies on them.
          </li>
          <li>
            Keep your password to yourself. Tell the school straight away if you
            think someone else has used your account.
          </li>
          <li>
            Driver and staff accounts are created by the school and are for
            school work only.
          </li>
        </ul>
      ),
    },
    {
      id: 'transport',
      title: 'Applying and placement',
      body: (
        <>
          <p>
            Adding a child in Fika is an <strong>application</strong> for school
            transport. The school decides whether to accept it, and which route,
            bus, pickup and drop-off times your child gets. The times depend on
            your child’s grade and may change during the year; Fika will tell
            you when they do.
          </p>
          <p>
            The school can move your child to another route or bus, or stop
            their transport, under its own transport rules, for example when
            fees are unpaid. A person at the school always makes that decision,
            not the app.
          </p>
        </>
      ),
    },
    {
      id: 'trips',
      title: 'Live trips and times',
      body: (
        <>
          <p>
            The bus position and the arrival times in Fika are estimates.
            Traffic, weather, roadworks and a weak phone signal can delay them
            or make them wrong. Please be at the stop a few minutes before the
            time shown.
          </p>
          <p>
            Fika helps the school run transport, but it does not replace the
            school’s or the driver’s duty of care for your child, or your own.
            If you can’t see the bus or reach your child, call the transport
            office on{' '}
            <a href={`tel:${SCHOOL.officePhone}`}>
              {formatPhone(SCHOOL.officePhone)}
            </a>
            . In an emergency call 999 or 112.
          </p>
        </>
      ),
    },
    {
      id: 'absence',
      title: 'Absences',
      body: (
        <p>
          If your child won’t ride, mark them absent in Fika as early as you
          can, so the bus doesn’t wait. A child marked absent at the morning
          pickup stays absent for the rest of that day unless the school marks
          them present again.
        </p>
      ),
    },
    {
      id: 'fees',
      title: 'Transport fees and M‑Pesa',
      body: (
        <>
          <p>
            Transport fees are set by the school for each term, and are owed to
            the school, not to Fika. Fika shows what you owe and lets you pay by
            M‑Pesa.
          </p>
          <ul>
            <li>
              A payment is confirmed when Safaricom confirms it. Fika then shows
              the M‑Pesa receipt code.
            </li>
            <li>
              Check the phone number and amount before you enter your PIN. Fika
              never asks for your PIN.
            </li>
            <li>
              Questions about a fee, a refund or a payment you made by mistake
              go to the school’s office. Refunds follow the school’s fees
              policy.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'use',
      title: 'Using Fika fairly',
      body: (
        <>
          <p>Please don’t:</p>
          <ul>
            <li>use another person’s account, or let them use yours;</li>
            <li>
              copy, share or post other children’s details, photos or the bus’s
              location;
            </li>
            <li>
              enter false information, such as a wrong stop or a false absence;
            </li>
            <li>try to break, overload or get round the security of Fika.</li>
          </ul>
          <p>
            <strong>Drivers:</strong> don’t use Fika while the bus is moving.
            Stop safely first, or let the conductor use it.
          </p>
          <p>The school may suspend an account that breaks these rules.</p>
        </>
      ),
    },
    {
      id: 'service',
      title: 'Availability and changes',
      body: (
        <p>
          We work to keep Fika running, but it may sometimes be unavailable, for
          example during maintenance or if your phone has no data. We may
          improve or change Fika over time. If we change these terms in a way
          that matters, we will tell you in Fika before the change applies;
          continuing to use Fika after that means you accept the new terms.
        </p>
      ),
    },
    {
      id: 'liability',
      title: 'Responsibility',
      body: (
        <p>
          Fika is provided as it is. As far as Kenyan law allows, Fika is not
          responsible for losses caused by delays, wrong estimates, a phone or
          network failure, or information entered wrongly by a user. Nothing in
          these terms takes away rights you have under Kenyan law, including the
          Consumer Protection Act, 2012, or limits responsibility for injury
          caused by negligence.
        </p>
      ),
    },
    {
      id: 'ending',
      title: 'Closing your account',
      body: (
        <p>
          You can stop using Fika at any time by asking the school to close your
          account. The school closes accounts when a child stops using school
          transport or a staff member leaves. What happens to the data
          afterwards is set out in the{' '}
          <Link to="/privacy#keeping">Privacy notice</Link>.
        </p>
      ),
    },
    {
      id: 'law',
      title: 'Law and contact',
      body: (
        <>
          <p>
            These terms are governed by the laws of Kenya. If there is a
            problem, please talk to us first; we will try to settle it together.
            Otherwise it goes to the courts of Kenya.
          </p>
          <p>
            School transport: {SCHOOL.address},{' '}
            <a href={`mailto:${SCHOOL.officeEmail}`}>{SCHOOL.officeEmail}</a>,{' '}
            <a href={`tel:${SCHOOL.officePhone}`}>
              {formatPhone(SCHOOL.officePhone)}
            </a>
            .
            <br />
            The Fika app: {PROVIDER.person},{' '}
            <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a>,{' '}
            <a href={`tel:${PROVIDER.phone}`}>{formatPhone(PROVIDER.phone)}</a>.
          </p>
        </>
      ),
    },
  ]

  return (
    <LegalLayout
      title="Terms of use"
      intro={`The agreement between you, ${school} and Fika when you use Fika for school transport.`}
      summary={[
        'Adding a child is an application. The school decides on routes, buses and times.',
        'Live bus positions and arrival times are estimates; be at the stop a few minutes early.',
        'Transport fees are owed to the school. Fika never asks for your M‑Pesa PIN.',
        'Keep your account to yourself, and other children’s details private.',
        'Kenyan law applies, and your consumer rights are not affected.',
      ]}
      sections={sections}
      otherPage={{ to: '/privacy', label: 'Privacy notice' }}
    />
  )
}
