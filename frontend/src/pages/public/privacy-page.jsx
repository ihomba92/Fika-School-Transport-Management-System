import { LegalLayout } from '@/components/public/legal-layout'
import { PROVIDER } from '@/config/legal'
import { SCHOOL } from '@/data/school'
import { formatPhone } from '@/lib/format'

// The privacy notice the Data Protection Act, 2019 requires (section 29:
// the duty to tell people what is collected, why, who sees it and their
// rights). The school is the data controller; Fika processes data for it.
// Have an advocate review it, and the school confirm its details, before
// launch.
export function PrivacyPage() {
  const school = SCHOOL.name
  const sections = [
    {
      id: 'who',
      title: 'Who looks after your data',
      body: (
        <>
          <p>
            <strong>{school}</strong> runs its school transport with Fika. The
            school decides what Fika is used for, so under Kenya’s Data
            Protection Act, 2019 it is the <strong>data controller</strong>.
            Fika, provided by {PROVIDER.person} in {PROVIDER.place}, runs the
            service for the school and is its <strong>data processor</strong>.
            Fika uses your data only on the school’s instructions and for the
            purposes in this notice.
          </p>
          <p>
            Privacy questions and requests go to the school at{' '}
            <a href={`mailto:${SCHOOL.privacyEmail}`}>{SCHOOL.privacyEmail}</a>.
            You can also reach Fika at{' '}
            <a href={`mailto:${PROVIDER.email}`}>{PROVIDER.email}</a>.
          </p>
        </>
      ),
    },
    {
      id: 'what',
      title: 'What we collect',
      body: (
        <>
          <p>
            <strong>About parents and guardians:</strong> your name, email
            address and mobile number; your password (stored only in a form that
            can’t be read back); your language choice; and, if you sign in with
            Google, the name and email Google shares.
          </p>
          <p>
            <strong>About your children:</strong> name, grade, a recent photo,
            transport plan, and the pickup and drop-off points you enter
            (address, a pin on the map and directions for the driver). While
            they use the bus we also record each trip: when they were picked up
            or dropped off, or marked absent.
          </p>
          <p>
            <strong>About drivers:</strong> name, email, mobile number, driving
            licence number and photo, which the school enters, and the bus’s
            location while a trip is running.
          </p>
          <p>
            <strong>Payments:</strong> the M‑Pesa phone number, amount, date and
            receipt code of each transport fee payment.{' '}
            <strong>Fika never sees or asks for your M‑Pesa PIN</strong>; you
            enter it on your own phone, in Safaricom’s prompt.
          </p>
          <p>
            <strong>Messages and notifications</strong> Fika sends you, and
            whether you have read them.
          </p>
        </>
      ),
    },
    {
      id: 'why',
      title: 'Why we use it',
      body: (
        <>
          <ul>
            <li>
              To place your child on a route and a bus, and plan each day’s
              trips.
            </li>
            <li>
              To let the driver recognise your child at the stop, and to know
              who is on the bus.
            </li>
            <li>
              To show you where the bus is, and tell you when your child is
              picked up and dropped off.
            </li>
            <li>
              To bill transport fees, take M‑Pesa payments and send receipts.
            </li>
            <li>
              To contact you about your child’s transport, and in an emergency.
            </li>
            <li>
              To keep the service safe and working, and to produce monthly
              reports for the school (on time, how full the buses are, fees),
              which use totals, not individual children.
            </li>
          </ul>
          <p>
            We use your data because you asked the school for transport and
            agreed to this notice when you created your account, and because the
            school needs it to run transport safely. You can withdraw your
            consent at any time (section 7); the school then stops your child’s
            transport through Fika.
          </p>
          <p>
            We never sell your data, use it for advertising, or use children’s
            photos for anything except recognising them at the bus.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      title: 'Children’s data',
      body: (
        <>
          <p>
            Children don’t have their own Fika accounts. Their details come from
            their parent or guardian, whose consent the Act requires, and are
            used only in the child’s interest: getting them to school and home
            safely.
          </p>
          <ul>
            <li>
              A child’s photo, name and stop are seen only by their own parents,
              the driver of their bus and the school’s transport office.
            </li>
            <li>
              Other parents never see your child. On the bus map they see only
              the bus, and only while it carries their own children.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'location',
      title: 'Bus location',
      body: (
        <p>
          The driver’s phone shares the bus’s location <strong>only</strong>{' '}
          from <em>Start trip</em> to <em>End trip</em>, never before or after,
          and never outside school runs. Parents see the bus only while it is
          carrying their child. Fika does not track parents’ or children’s own
          phones.
        </p>
      ),
    },
    {
      id: 'sharing',
      title: 'Who we share it with',
      body: (
        <>
          <p>
            Inside the school: the transport office and, for your child only,
            the driver of their bus (name, grade, photo, stop and your phone
            number, so they can call you).
          </p>
          <p>
            Outside the school, only the companies that help run Fika, for that
            purpose only:
          </p>
          <ul>
            <li>Safaricom, for M‑Pesa payments.</li>
            <li>Google, if you choose to sign in with Google.</li>
            <li>
              Our hosting, database, email and phone-notification providers.
            </li>
            <li>
              Map providers, which receive your phone’s internet address when a
              map is shown (not your name).
            </li>
          </ul>
          <p>
            Some of these providers keep data outside Kenya. We use them only
            where the Act’s safeguards for transfers out of Kenya are met. We
            share data with the police or a court only when the law requires it.
          </p>
        </>
      ),
    },
    {
      id: 'rights',
      title: 'Your rights',
      body: (
        <>
          <p>Under the Data Protection Act, 2019 you have the right to:</p>
          <ul>
            <li>be told how your data is used (this notice);</li>
            <li>see the data we hold about you and your child;</li>
            <li>have wrong or misleading data corrected or deleted;</li>
            <li>object to, or withdraw consent for, its use;</li>
            <li>have it deleted when it is no longer needed;</li>
            <li>receive a copy in a common format, to take elsewhere.</li>
          </ul>
          <p>
            As a parent or guardian you use these rights for your child. You can
            change most details yourself in Fika (Children and your profile).
            For anything else, write to{' '}
            <a href={`mailto:${SCHOOL.privacyEmail}`}>{SCHOOL.privacyEmail}</a>.
            We may ask you to confirm who you are first.
          </p>
          <p>
            Fika suggests routes and flags unpaid fees, but a person at the
            school makes every decision about your child: placing them on a bus,
            or taking them off one.
          </p>
        </>
      ),
    },
    {
      id: 'keeping',
      title: 'How long we keep it',
      body: (
        <ul>
          <li>
            Your account and your child’s details: while your child uses school
            transport, and up to 12 months after they stop. Then they are
            deleted, or made anonymous for totals.
          </li>
          <li>Bus location points: 90 days.</li>
          <li>
            Trip and attendance records: the current school year and the one
            after it.
          </li>
          <li>
            Payment records: at least five years, as Kenya’s tax law requires.
          </li>
        </ul>
      ),
    },
    {
      id: 'security',
      title: 'How we protect it',
      body: (
        <>
          <p>
            Fika is only reached over encrypted connections (HTTPS). Passwords
            are stored in a form that can’t be read back. Each person sees only
            what their role needs: parents their own family, drivers their own
            bus for the day, and the school’s staff the school’s data.
          </p>
          <p>
            If data is ever exposed, Fika tells the school within 48 hours, and
            the school tells the Data Protection Commissioner within 72 hours
            and tells the families affected, as the Act requires.
          </p>
        </>
      ),
    },
    {
      id: 'device',
      title: 'What Fika keeps on your phone',
      body: (
        <p>
          Fika keeps a few things in your browser so it works the way you left
          it: that you are signed in, your light or dark mode, English or
          Kiswahili, the <em>Save data</em> choice, and whether you closed the
          install banner. There are no advertising cookies or trackers.
        </p>
      ),
    },
    {
      id: 'complaints',
      title: 'Questions and complaints',
      body: (
        <>
          <p>
            Write to the school at{' '}
            <a href={`mailto:${SCHOOL.privacyEmail}`}>{SCHOOL.privacyEmail}</a>{' '}
            or call the transport office on{' '}
            <a href={`tel:${SCHOOL.officePhone}`}>
              {formatPhone(SCHOOL.officePhone)}
            </a>
            . If you are not happy with the answer, you can complain to the
            Office of the Data Protection Commissioner at{' '}
            <a href="https://www.odpc.go.ke" target="_blank" rel="noreferrer">
              www.odpc.go.ke
            </a>
            .
          </p>
          <p>
            If this notice changes, we will tell you in Fika before the change
            applies. The date at the top shows the latest version.
          </p>
        </>
      ),
    },
  ]

  return (
    <LegalLayout
      title="Privacy notice"
      intro={`How ${school} and Fika collect, use and protect the details of parents, children and drivers who use school transport.`}
      summary={[
        `${school} is responsible for your data; Fika runs the service for the school.`,
        'We collect what transport needs: your contact details, your child’s name, grade, photo and stops, trip records and fee payments.',
        'The bus’s location is shared only during a trip, and only with the parents of children on it.',
        'Your child’s photo is seen only by you, their driver and the school’s transport office.',
        'We never sell your data or use it for advertising. You can see, correct or delete it.',
      ]}
      sections={sections}
      otherPage={{ to: '/terms', label: 'Terms of use' }}
    />
  )
}
